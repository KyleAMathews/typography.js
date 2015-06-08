React = require 'react'
gray = require 'gray-percentage'
Reflux = require 'reflux'
TypographyStore = require './TypographyStore'

module.exports = React.createClass
  displayName: 'Styleguide'

  mixins: [
    Reflux.connect(TypographyStore, 'typography')
  ]

  render: ->
    unless @state.typography
      <div />
    else
      <div>
        <h1 style={{marginBottom: @state.typography.rhythm(1/2)}}>Typography.js</h1>

        <h5>An opinionated toolkit for building websites with beautiful typography.</h5>

        <a style={{color: '#2196F3'}} href="https://github.com/KyleAMathews/typography.js">Code on Github</a>
        <br />
        <br />

        <hr />

        <h1 id="paragraph">Paragraph</h1>

        <p>Lorem ipsum dolor sit amet, <a style={{color: '#2196F3'}} href="http://google.com">test link</a> adipiscing elit. Nullam dignissim convallis est. Quisque aliquam. Donec faucibus. Nunc iaculis suscipit dui. Nam sit amet sem. Aliquam libero nisi, imperdiet at, tincidunt nec, gravida vehicula, nisl. Praesent mattis, massa quis luctus fermentum, turpis mi volutpat justo, eu volutpat enim diam eget metus. Maecenas ornare tortor. Donec sed tellus eget sapien fringilla nonummy. Mauris a ante. Suspendisse quam sem, consequat at, commodo vitae, feugiat in, nunc. Morbi imperdiet augue quis tellus.</p>

        <h2>A nice subheading</h2>

        <p>Lorem ipsum dolor sit amet, <em>emphasis</em> consectetuer adipiscing elit. Nullam dignissim convallis est. Quisque aliquam. Donec faucibus. Nunc iaculis suscipit dui. Nam sit amet sem. Aliquam libero nisi, imperdiet at, tincidunt nec, gravida vehicula, nisl. Praesent mattis, massa quis luctus fermentum, turpis mi volutpat justo, eu volutpat enim diam eget metus. Maecenas ornare tortor. Donec sed tellus eget sapien fringilla nonummy. Mauris a ante. Suspendisse quam sem, consequat at, commodo vitae, feugiat in, nunc. Morbi imperdiet augue quis tellus.</p>

        <hr />

        <h1 id="headings">Headings</h1>

        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <h5>Heading 5</h5>
        <h6>Heading 6</h6>

        <hr />

        <h1 id="list_types">List Types</h1>

        <h3>Definition List</h3>
        <dl>
          <dt>Definition List Title</dt>
          <dd>This is a definition list division.</dd>
        </dl>

        <h3>Ordered List</h3>
        <ol>
          <li>List Item 1</li>
          <li>List Item 2</li>
          <li>List Item 3</li>
          <ol>
            <li>List Item 1</li>
            <li>List Item 2</li>
            <li>List Item 3</li>
          </ol>
        </ol>

        <h3>Unordered List</h3>
        <ul>
          <li>List Item 1</li>
          <li>List Item 2</li>
          <li>List Item 3</li>
          <ul>
            <li>List Item 1</li>
            <li>List Item 2</li>
            <li>List Item 3</li>
          </ul>
        </ul>

        <hr />

        <h1 id="tables">Tables</h1>

        <table>
          <thead>
            <tr>
              <th>Table Header 1</th><th>Table Header 2</th><th>Table Header 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Division 1</td><td>Division 2</td><td>Division 3</td>
            </tr>
            <tr>
              <td>Division 1</td><td>Division 2</td><td>Division 3</td>
            </tr>
            <tr>
              <td>Division 1</td><td>Division 2</td><td>Division 3</td>
            </tr>
          </tbody>
        </table>

        <br />
        <hr />

        <h1 id="misc">Misc Stuff - abbr, sub, sup, pre, blockquote etc.</h1>

        <p>Lorem <sup>superscript</sup> dolor <sub>subscript</sub> amet, consectetuer adipiscing elit. Nullam dignissim convallis est. Quisque aliquam. <cite>cite</cite>. Nunc iaculis suscipit dui. Nam sit amet sem. Aliquam libero nisi, imperdiet at, tincidunt nec, gravida vehicula, nisl. Praesent mattis, massa quis luctus fermentum, turpis mi volutpat justo, eu volutpat enim diam eget metus. Maecenas ornare tortor. Donec sed  tellus eget sapien fringilla nonummy. Mauris a ante. Suspendisse quam sem, consequat at, commodo vitae, feugiat in, nunc. Morbi imperdiet augue quis tellus.  <abbr title="Avenue">AVE</abbr></p>

        <h3>Bivouac on a mountain side.</h3>
        <pre>
  I see before me now a traveling army halting,
  Below a fertile valley spread, with barns and the orchards of
         summer,
  Behind, the terraced sides of a mountain, abrupt, in places rising
         high,
  Broken, with rocks, with clinging cedars, with tall shapes dingily
         seen,
  The numerous camp-fires scatter'd near and far, some away up on
         the mountain,
  The shadowy forms of men and horses, looming, large-sized,
         flickering,
  And over all the sky—the sky! far, far out of reach, studded,
         breaking out, the eternal stars.
        </pre>

        <blockquote>
          <p>"This stylesheet is going to help so freaking much." <br />-Blockquote</p>
        </blockquote>

        <hr />

        <h1 id="code">Code</h1>
        <pre>
          <code ref="code">
          {'''
            code {
              @include border-radius(3px);
              @include force-wrap();
              background: gray(90%);
              border: 1px solid gray(80%);
              display: inline;
              font-family: Inconsolata, monospace, serif;
              font-size: 16px;
              line-height: 20px;
              max-width: 100%;
              overflow: auto;
              padding: 0 rhythm(0.125);
            }
          '''}
          </code>
        </pre>

        <hr />

        <h1>This is an example of Heading 1</h1>
        <p>A simple paragraph. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        <h2>This is an example of heading 2</h2>
        <p>A simple paragraph. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        <h3>This is an example of heading 3</h3>
        <p>A simple paragraph. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        <h4>This is an example of heading 4</h4>
        <p>A simple paragraph. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        <h5>This is an example of heading 5</h5>
        <p>A simple paragraph. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        <h6>This is an example of heading 6</h6>
        <p>A simple paragraph. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
