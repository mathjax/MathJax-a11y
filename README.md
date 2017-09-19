# MathJax-Accessibility

MathJax extensions for accessibility features (with demos). 

## Source

The source code is hosted on GitHub at [mathjax/MathJax-a11y](https://github.com/mathjax/MathJax-a11y/).

## Documentation

The documentation can be found at [/docs](https://mathjax.github.io/MathJax-a11y/docs/). Slides from [Volker Sorge's talk at CSUN 2016](https://mathjax.github.io/MathJax-a11y/slides/csun16-talk.pdf) are also available.

## Live tests

* [Collapsing equations test lab with TeX input](https://mathjax.github.io/MathJax-a11y/Semantics-Lab/TeX.html)
* [Collapsing equations test lab with MathML input](https://mathjax.github.io/MathJax-a11y/Semantics-Lab/MathML.html)
* [Semantics linebreaking test lab with TeX input](https://mathjax.github.io/MathJax-a11y/Semantics-Lab/TeX-linebreaking.html)
* [Semantics linebreaking test lab with MathML input](https://mathjax.github.io/MathJax-a11y/Semantics-Lab/MathML-linebreaking.html)
* [Example page with responsive equations](https://mathjax.github.io/MathJax-a11y/examples/Struik.html)
* [Equation explorer test lab with TeX input](https://mathjax.github.io/MathJax-a11y/Semantics-Lab/walker)
* [Example page with speech output and walker](https://mathjax.github.io/MathJax-a11y/examples/Struik-speech.html)



## Build

To build the distribution repository for the MathJax Accessibility extension, just call grunt with the default task.

```bash
npm install --only=dev && grunt
```

Note that this repository heavily depends on [SRE](https://github.com/zorkow/speech-rule-engine)


### Build order as implemented in the Gruntfile

* Prep `dist` folder
* Clone speech-rule-engine
* Install npm dependencies for speech-rule-engine
* Run `make mathjax` in speech-rule-engine to build an optimized version
* Copy `lib/sre_mathjax.js` and `lib/wgxpath.install.js` to `dist`
* Copy subdirectories from `src/mathmaps` to `dist`
* JSON minify json files in `mathmaps`
* Minify `src/mathmaps/mathmaps_ie.js` to `dist/mathmaps`
* Minify `extensions/\*.js` to destination `dist`
* Copy `invalid_keypress.mp3` and `invalid_keypress.ogg` to `dist`
* Clean up: remove `speech-rule-engine` folder

### Generated files

The build process will generate the following files:

* The minified versions of the assistive technology extension files.
* The closure compiled version of the
  [speech rule engine](https://github.com/zorkow/speech-rule-engine).
* A single file that combines all of the above.
* mathmaps_ie.js: File with JSON objects that is loaded by the speech rule
  engine if it runs on IE or Edge.
* mathmaps: JSON files that are loaded by the speech rule engine if it runs in
  any other browser or environment.
* wxpath.install.js: A copy of
  [wicked-good-xpath](https://github.com/google/wicked-good-xpath) for use in IE
  and Edge.
