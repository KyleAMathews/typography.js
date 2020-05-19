## What is a declarative typography API?
Declarative & Imperative are the two basic types of programming.

Imperative is the oldest and still most common way to program. Most
languages such as Python, Ruby, and Javascript default to imperative.
Imperative programming is simply you the programmer giving step-by-step
instructions to the computer on how to do something. The computer is
treated as "dumb" and takes your instructions and executes them.

In contrast to imperative programming, declarative programming focuses
on *what* you're trying to achieve without needing to instruct the
computer on *how* to do it.

HTML and CSS are perfect examples of declarative programming.

When I type `<img src="https://example.com/dog.jpg" />` I don't care
about the details of fetching the image from example.com, decoding it,
figuring out how big it is, determining how it affects the layout of
other HTML elements, writing it to the screen, etc. etc. All I care
about is that a particular image shows up on the screen and I trust the
browser black-box to figure it out for me.

I *declare* my intention to the browser (show this image) and then the
browser figures out *how* to make it happen.

In a well-understood problem area, declarative programming can *really*
simplify APIs.

### CSS for Typography: is it a declarative or imperative API?
From most perspectives, CSS provides a declarative API. I say `.a-class
{ border-radius: 5px }` and magic happens. But what about the case of
creating a custom typography theme in CSS?

You start writing rules like:

```css
html {
    font-size: 118.75%;
    line-height: 1.5em;
}
body {
    color: hsl(0,0%,20%);
    font-family: Alegreya Sans,sans-serif;
    font-weight: 300;
    word-wrap: break-word;
    background: #fffdf8;
}
h1 {
    margin: 0;
    padding: 0;
    margin-bottom: 1.5rem;
    color: hsl(0,0%,10%);
    font-family: Alegreya,Georgia,serif;
    font-weight: 400;
    text-rendering: optimizeLegibility;
    font-size: 2rem;
    line-height: 2.25rem;
}
// and on and on and on.
```

Soon you're feeling a bit overwhelmed at the amount of fiddly rules +
numbers you have to track. `2rem`, `2.25rem`, `1.5rem`. How are you
supposed to remember what these mean? How are they calculated? What do
they mean? How would you tweak these (and dozens more) if you dislike or
just want to change your theme in the future?

These are the classic symptoms of writing imperative code at [too low a
level of an abstraction](http://worrydream.com/LadderOfAbstraction/).
You feel *weak* and *overwhelmed* instead of *strong* when using the provided APIs

CSS feels amazing when you write `body { background: red; }` but far
less so when you want to "lighten the feel of the body text by adding
additional spacing between elements".

Different APIs sit at different levels of abstractions. If the
abstraction level of our goal matches the abstraction level of the API,
we feel powerful and efficient using it. There exists a very simple and
powerful link between our goal and the APIs/tools we have to accomplish
that goal.

CSS is designed for manipulating the style of a single (or group) of
elements. So if your goals is to manipulate an element e.g. set the body
background to red then css is great.

By contrast if the API is at too high of level of abstraction compared
to our goal, we feel annoyed at the API "getting in our way".

Too low — grid, creating columns, response is people create css
libraries to improve this situation

Programming isn't ever purely declarative or imperative. Very early on
in computing, people decided that telling CPUs directly what to do using
"machine code" was really painful and error prone and that it'd be a
better to write code which does that for us. That was the invention of
"higher level languages". Programming ever since then has gone through
additional cycles of a group of people deciding that the existing APIs
are too low-level and creating new declarative APIs on top of them.

CSS is too low-level of an API to easily accomplish typography goals.

Typography is a system of interrelated styles. It's complex. You change
one idea and then dozens of styles have to change. This is why creating
Typography themes with CSS feels hard. You have a design idea and then
get bogged down as you try to express that idea across dozens of css
style rules.

Typography.js is exploration of what is the ideal API to define typography
design for the web.

New premitives:

 * base font / line height
 * scale ratio
 * rhythm unit
 * header/body font stack
 * Google fonts
 * header/body colors
 * font weights

Feed these into black box and spit out styles. Can do this cause
Typography is ancient and there's deep understanding about how fonts
should relate to each other etc.

On top of these we've added ability to distribute "themes" you come up
with along with "plugins" which provide configurable, specialized
styles.

