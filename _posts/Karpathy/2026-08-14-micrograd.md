---
layout: post
title: <Andrej Karpathy> - Micrograd
date: 2026-08-14
categories: [Karpathy]
tags: [neural-network, backprop, autograd]
---

This is my first post in a series following Andrej Karpathy's *Zero to Hero*, starting with **Building micrograd**.

I ran into this lecture when I first started studying LLMs, and I still think it's one of the simplest and most interesting ways to understand how neural networks actually train and update — not from the tensor level down, but built up from a single scalar. Instead of starting with tensors and large models, Karpathy begins at the scalar level and gradually builds everything required to train a neural network. You can watch the full lecture [here](https://www.youtube.com/watch?v=VMj-3S1tku0&t=6084s).

In this post, I want to reconstruct that process from both mathematical and implementation perspectives. I wrote it after watching the full lecture and then implementing the code myself, so the focus is not just on what each piece of code does, but on **why the pieces are designed this way and how they eventually form a trainable neural network**.

I recommend reading this post alongside the micrograd source code, especially [`engine.py`](https://github.com/karpathy/micrograd/blob/master/micrograd/engine.py) and [`nn.py`](https://github.com/karpathy/micrograd/blob/master/micrograd/nn.py).

## Contents

1. Derivatives
2. The `Value` Class
3. Computational Graphs
4. Backpropagation
5. Extending Autograd
6. Neural Networks
7. From micrograd to Large Neural Networks
8. Closing Thoughts

---

## 1. Derivatives

The [derivative](https://en.wikipedia.org/wiki/Derivative) of a function is defined as

$$
f'(x)
=
\lim_{h\to0}
\frac{f(x+h)-f(x)}{h}
$$

and describes how sensitive the output of a function is to a small change in its input.

For example, we can approximate this derivative numerically by choosing a sufficiently small $h$:

$$
f'(x)
\approx
\frac{f(x+h)-f(x)}{h}
$$

with values such as $h=10^{-3}$, $10^{-6}$, or $10^{-9}$.

This idea becomes important when thinking about neural networks. A neural network is a very large composition of mathematical operations, potentially containing billions of parameters. What we ultimately want during training is to know how changing each parameter affects the final loss — and doing that by symbolically differentiating one enormous expression, or by perturbing each parameter independently, would very quickly become impractical.

micrograd therefore begins at the smallest possible level: a **single scalar value**. We'll come back to a concrete expression once we have a `Value` object to hold it.

---

## 2. The `Value` Class

The initial `Value` class is almost trivial:

```python
class Value:
    def __init__(self, data):
        self.data = data

    def __repr__(self):
        return f"Value(data={self.data})"
```

At this point, `Value` is simply a wrapper around a scalar.

To make mathematical expressions possible, we implement operators such as `__add__` and `__mul__`.

Then

```python
a + b
```

is effectively interpreted by Python as

```python
a.__add__(b)
```

This already works once both `a` and `b` are `Value` objects. But another problem appears when one operand is an ordinary Python scalar — say `a * 2`. We can handle this by converting it into a `Value`:

```python
other = other if isinstance(other, Value) else Value(other)
```

Now expressions such as

```python
a * 2
```

work.

But

```python
2 * a
```

still fails, because Python calls `int.__mul__(2, a)` first, which doesn't know how to handle a `Value`. It falls back to Python's reflected operator method `__rmul__` on `a`. Similarly, `__radd__` handles addition when the `Value` appears on the right-hand side.

Subtraction and division can be constructed from operations we already have.

For example,

$$
a-b=a+(-b)
$$

and

$$
\frac{a}{b}=a\cdot b^{-1}
$$

This leads naturally to methods such as `__neg__`, `__sub__`, `__truediv__`, and their reflected counterparts such as `__rsub__` and `__rtruediv__`.

An interesting design principle already appears here: **complex operations can often be built by composing simpler primitive operations**.

But the `Value` class still has a major limitation. It knows its value, but it does not know **where that value came from**.

That leads to the computational graph.

---

## 3. Computational Graphs

Consider

$$
d=ab+c
$$

with

```python
a = Value(2.0)
b = Value(-3.0)
c = Value(10.0)
```

and let's name the intermediate result $e=ab$, so that $d=e+c$.

Computing `d` gives us its numerical value, but if we later want to differentiate `d`, we also need to know that `d` came from an addition involving `e` and `c`, and that `e` came from multiplying `a` and `b`.

We therefore extend `Value` with information such as `_children` and `_op`.

Each `Value` now remembers:

- the scalar it stores,
- which previous `Value`s produced it,
- and which operation connected them.

The calculation $d=ab+c$ can therefore be represented as a graph:

```text
a ──┐
    × → e ──┐
b ──┘       │
            + → d
c ──────────┘
```

micrograd visualizes this structure using Graphviz, through two functions:

```python
def trace(root):
    nodes, edges = set(), set()
    def build(v):
        if v not in nodes:
            nodes.add(v)
            for child in v._prev:
                edges.add((child, v))
                build(child)
    build(root)
    return nodes, edges

def draw_dot(root, format='svg', rankdir='LR'):
    ...
```

`trace(root)` recursively walks `_prev` starting from the output node and collects every node and edge it touches. `draw_dot(root)` then turns that collection into a picture, using

```python
Digraph(format="svg", graph_attr={"rankdir": "LR"})
```

`rankdir="LR"` lays the graph out **left to right**, so the operations read the same direction as the forward pass. SVG is a convenient default format here because it's vector-based and stays sharp at any zoom level, though `draw_dot` can just as easily produce PNG.

For every `Value`, `draw_dot` creates a node containing its stored information. If the `Value` was produced by an operation, another node representing that operation is inserted between its inputs and output — which is why multiplication is drawn as

```text
a ──┐
    * → e
b ──┘
```

rather than simply drawing edges directly from `a` and `b` to `e`.

*(Code: [`trace_graph.ipynb`](https://github.com/karpathy/micrograd/blob/master/trace_graph.ipynb))*

The result is a visual record of the **forward pass**. But training requires information to travel in the opposite direction.

---

## 4. Backpropagation

Before getting into the mechanics, it's worth asking: why [backpropagation](https://en.wikipedia.org/wiki/Backpropagation) specifically? There are other ways to estimate a gradient — the numerical approximation from Section 1, for instance, could in principle be applied to every parameter one at a time. But that cost grows linearly with the number of parameters, while backpropagation computes the gradient with respect to *every* parameter in roughly the cost of one extra pass through the graph. That difference is what makes it the de facto standard for training modern neural networks. (Whether there's a fundamentally different, equally efficient way to get gradients out of a computational graph feels like an interesting question to come back to on its own.)

To make this concrete, let's reuse Karpathy's example, now with actual numbers:

$$
e=ab,\qquad d=e+c,\qquad L=df
$$

$$
a=2,\quad b=-3,\quad c=10,\quad f=-2
$$

The forward pass computes $L$. For learning, we want quantities such as

$$
\frac{\partial L}{\partial a},
\quad
\frac{\partial L}{\partial b},
\quad
\frac{\partial L}{\partial c},
\quad
\frac{\partial L}{\partial f}
$$

— these derivatives tell us how sensitive the final output is to each value.

For variables directly connected to $L$, the derivatives are easy. Since $L=df$,

$$
\frac{\partial L}{\partial d}=f
\qquad\text{and}\qquad
\frac{\partial L}{\partial f}=d
$$

But what about $e$, $a$, or $b$? We could expand the entire expression for $L$ and differentiate it directly, but this approach becomes increasingly impractical as the computational graph grows.

The key idea is the [chain rule](https://en.wikipedia.org/wiki/Chain_rule). Suppose

$$
x \rightarrow y \rightarrow L
$$

Then

$$
\frac{dL}{dx}
=
\frac{dL}{dy}\cdot
\frac{dy}{dx}
$$

Here, $\dfrac{dy}{dx}$ is the **local derivative** — something each node can compute on its own, knowing only its own operation — while $\dfrac{dL}{dy}$ is the gradient arriving from later in the graph, the **upstream gradient**. So each node only needs to perform

$$
\text{upstream gradient}
\times
\text{local derivative}
$$

to propagate a gradient backward.

<img src="{{ '/assets/images/micrograd/chain-rule-diagram.svg' | relative_url }}" alt="chain rule diagram" width="700">

For a longer chain,

$$
x\rightarrow p\rightarrow q\rightarrow L
$$

the same idea recursively gives

$$
\frac{\partial L}{\partial x}
=
\frac{\partial L}{\partial q}\cdot
\frac{\partial q}{\partial p}\cdot
\frac{\partial p}{\partial x}
$$

This is why backpropagation scales so elegantly through a computational graph: **each operation only needs to know its own local derivative**.

(For vector-valued $x$ and $y$ — the case that actually shows up once we get to layers — this generalizes to Jacobians instead of scalar derivatives. We won't need that machinery for the scalar-only micrograd engine, so I'll leave it at that.)

### Gradient Accumulation

There is one more important case. Suppose $x$ affects $L$ through multiple paths:

```text
    → p →
x           L
    → q →
```

Then the total effect of $x$ is the sum of the contributions from both paths:

$$
\frac{\partial L}{\partial x}
=
\frac{\partial L}{\partial p}\cdot
\frac{\partial p}{\partial x}
+
\frac{\partial L}{\partial q}\cdot
\frac{\partial q}{\partial x}
$$

This explains why micrograd uses

```python
self.grad += ...
```

rather than

```python
self.grad = ...
```

A useful way to remember the rule is:

> **Multiply along a path, sum across paths.**

### Storing the Backward Rule

Each operation defines its own `_backward` function. For multiplication:

```python
def _backward():
    self.grad += other.data * out.grad
    other.grad += self.data * out.grad

out._backward = _backward
```

Notice that we store `_backward`, not `_backward()`. Calling `_backward()` immediately would execute the function during the forward pass and store its return value, which is `None`. Instead, we want the graph to **remember the function so that it can be executed later during backpropagation**.

The backward pass starts from

$$
\frac{\partial L}{\partial L}=1
$$

and proceeds through the graph in reverse topological order. This guarantees that a node receives its upstream gradient before it tries to propagate that gradient further backward.

At this point, `Value` is no longer just a scalar wrapper. It has become a small **automatic differentiation engine**, and running `backward()` on our small example gives every node both a `data` and a `grad`:

<img src="{{ '/assets/images/micrograd/micrograd_comp_graph.svg' | relative_url }}" alt="micrograd computational graph" width="700">

---

## 5. Extending Autograd

So far, our engine can handle basic arithmetic. Neural networks, however, require additional differentiable operations.

For powers,

$$
y=x^n
$$

the local derivative is

$$
\frac{dy}{dx}=nx^{n-1}
$$

For the exponential,

$$
y=e^x
$$

we have

$$
\frac{dy}{dx}=e^x
$$

We can therefore add `__pow__` and `exp` to `Value` using exactly the same pattern: compute the forward value, then attach the corresponding local backward rule.

The same applies to $\tanh$, a common activation function:

$$
\tanh(x)
=
\frac{e^{2x}-1}{e^{2x}+1}
$$

with derivative

$$
\frac{d}{dx}\tanh(x)
=
1-\tanh^2(x)
$$

Technically, `tanh` could be decomposed into exponentiation, subtraction, addition, and division. But an autograd engine does not require every operation to be decomposed into the smallest possible primitive. We can treat `tanh` as an atomic differentiable operation as long as we know both its forward computation and its local derivative.

This reveals one of the central ideas behind autograd:

> **To add a differentiable operation, we mainly need to define how it computes forward and how it propagates gradients backward.**

*(One accuracy note, since I recommended reading alongside the actual repo: the `tanh` above is how Karpathy builds it live in the lecture, but the current `engine.py` on GitHub ships `relu` instead — the library was tidied up after the video to default to ReLU. The mechanism is identical either way: define the forward value and the local derivative once, and the engine handles the rest.)*

---

## 6. Neural Networks

Until now, everything has happened at the scalar level. The next step is to compose these scalar operations into an actual neural network.

A single neuron receives multiple inputs and assigns a separate weight to each input:

$$
z
=
\sum_i w_i x_i+b
$$

The activation function then produces

$$
o=\tanh(z)
$$

So one neuron can be viewed as

```text
x₁ ── w₁ ──┐
x₂ ── w₂ ──┼──→ neuron → output
x₃ ── w₃ ──┘
             + b
```

micrograd builds the network hierarchically:

```text
Value
  ↓
Neuron
  ↓
Layer
  ↓
MLP
```

A `Neuron` owns its weights and bias. A `Layer` contains multiple neurons. An `MLP` contains multiple layers. Using `__call__`, each object can behave like a function, so

```python
n(x)
```

naturally represents a forward pass through the network.

The parameter structure follows the same hierarchy. A neuron returns its weights and bias through `parameters()`, a layer collects the parameters of all its neurons, and the MLP collects the parameters of all its layers.

For example,

```python
n = MLP(3, [4, 4, 1])
```

creates a network with architecture

$$
3\rightarrow4\rightarrow4\rightarrow1
$$

<img src="{{ '/assets/images/micrograd/mlp-structure.svg' | relative_url }}" alt="MLP structure" width="700">

In standard neural-network notation, a layer is often summarized as

$$
\mathbf{z}
=
W\mathbf{x}+\mathbf{b}
$$

but micrograd deliberately performs these calculations one scalar `Value` at a time. That is what makes the implementation educational: the familiar tensor operations of a neural network can be traced all the way down to individual scalar multiplications and additions.

*(Code: [`nn.py`](https://github.com/karpathy/micrograd/blob/master/micrograd/nn.py) — `Neuron`, `Layer`, `MLP`)*

### Training the MLP

Suppose the network produces predictions $\hat y_i$. In the lecture example, we measure their error using a squared-error loss:

$$
L
=
\sum_i(\hat y_i-y_i)^2
$$

Calling

```python
loss.backward()
```

computes

$$
\frac{\partial L}{\partial \theta}
$$

for every learnable parameter $\theta$. It's useful to separate two concepts here:

**Backpropagation computes the gradients. Gradient descent uses those gradients to update the parameters.**

The gradient $\nabla_\theta L$ points in the direction of the steepest local *increase* of the loss — it's built entirely out of the local/upstream products from Section 4, just accumulated over every parameter at once. So if we take a small step in the *opposite* direction, the loss decreases: to first order, moving by $-\eta\nabla_\theta L$ changes the loss by approximately $-\eta\lVert\nabla_\theta L\rVert^2$, which is negative as long as the gradient isn't already zero and $\eta$ is small enough. That's the entire justification for

$$
\theta
\leftarrow
\theta-\eta\nabla_\theta L
$$

where $\eta$ is the learning rate — we're not searching for the update rule, we're just walking downhill using the slope we already computed.

In micrograd:

```python
for p in n.parameters():
    p.data += -step_size * p.grad
```

The training process is therefore:

```text
forward
→ compute loss
→ backward
→ update parameters
→ zero gradients
→ repeat
```

The last step is easy to overlook. Because micrograd intentionally accumulates gradients using `+=`, calling `backward()` again without clearing them would add the new gradients to those from the previous training iteration. Therefore, before computing the gradients for the next optimization step:

```python
for p in n.parameters():
    p.grad = 0.0
```

must be performed.

In this small example, the network has enough capacity to fit the training data and the loss can approach zero. But squared error satisfying $L\ge0$ does not itself guarantee convergence to zero; optimization also depends on the model, data, and learning rate.

---

## 7. From micrograd to Large Neural Networks

The network built in Karpathy's example contains only **41 parameters**. Modern neural networks may contain billions or even hundreds of billions of parameters. At first glance, such models seem completely disconnected from the tiny scalar engine we have just built.

Conceptually, however, the distance is much smaller than it appears. The fundamental training loop remains:

```text
forward computation
        ↓
loss
        ↓
automatic differentiation
        ↓
gradients
        ↓
optimizer
        ↓
parameter update
```

Real frameworks such as PyTorch operate on tensors rather than individual scalar `Value` objects and contain enormous amounts of engineering for efficient vectorized computation, GPU execution, memory management, distributed training, and many other concerns. But the mathematical foundation remains recognizable.

A modern neural network is still a composition of differentiable operations. Those operations form a computational graph. The chain rule propagates information backward through that graph, and the resulting gradients provide the information needed to optimize the parameters.

That is what makes micrograd so valuable educationally: **it is tiny enough to understand completely while still containing the core mechanism behind much larger neural networks.**

---

## 8. Closing Thoughts

The main ideas I want to remember from building micrograd are:

- A derivative measures how one value responds to a small change in another.
- `Value` records both scalar data and the computation that produced it.
- These relationships form a computational graph.
- Backpropagation applies the chain rule backward through that graph.
- Along a path, derivatives multiply; when multiple paths meet, gradient contributions add.
- Autograd emerges by giving each operation a forward computation and a local backward rule.
- `Neuron → Layer → MLP` shows how simple scalar operations can be composed into a neural network.
- Backpropagation computes gradients; gradient descent uses those gradients to update parameters.
- Training is fundamentally a repeated cycle of **forward → loss → backward → update**.

After watching the lecture, I strongly recommend trying to implement micrograd yourself rather than only reading the finished code. I relied on references and help along the way as well, but reconstructing the model made the entire training process feel much more concrete. It is one thing to know that `loss.backward()` computes gradients; it is another to build the mechanism that makes `backward()` possible.

More broadly, I want to approach AI with the same question throughout my studies: **why does this particular mathematical rule or algorithm appear here?** Machine learning can sometimes feel unusually empirical compared with more theory-driven fields — a method is often considered important mainly because it works extremely well in practice. But that's exactly what makes understanding the mathematical structure underneath it more interesting to me, not less. Rather than treating backpropagation, optimization, or neural network architectures as rules to memorize, I want to understand why they arise naturally from the problem being solved, where their assumptions come from, and where alternative approaches might exist.

micrograd is a small starting point, but it's a particularly good one: from a single scalar derivative, we can reconstruct the basic machinery that eventually lets enormous neural networks learn. This is my first post trying to write things up this way, so I'm sure there's plenty I've missed or explained clumsily — but I'm planning to bring a lot more where this came from.

*For a better blog.*
