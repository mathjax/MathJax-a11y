# MathJax-Accessibility

MathJax extensions for accessibility features (with demos)

## Quick links

### Live tests

* [Collapsing equations test lab with TeX input](https://mathjax.github.io/MathJax-RespEq/Semantics-Lab/TeX.html)
* [Collapsing equations test lab with MathML input](https://mathjax.github.io/MathJax-RespEq/Semantics-Lab/MathML.html)
* [Semantics linebreaking test lab with TeX input](https://mathjax.github.io/MathJax-RespEq/Semantics-Lab/TeX-linebreaking.html)
* [Semantics linebreaking test lab with MathML input](https://mathjax.github.io/MathJax-RespEq/Semantics-Lab/MathML-linebreaking.html)
* [Example page with responsive equations](https://mathjax.github.io/MathJax-RespEq/examples/Struik.html)
* [Equation explorer test lab with TeX input](https://mathjax.github.io/MathJax-RespEq/Semantics-Lab/walker)
* [Example page with speech output and walker](https://mathjax.github.io/MathJax-RespEq/examples/Struik-speech.html)

### Documentation

* [CSUN 2016 slides](https://mathjax.github.io/MathJax-RespEq/slides/csun16-talk.pdf)


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
