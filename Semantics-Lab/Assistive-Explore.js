//
// Connection to SRE explorer.
//
MathJax.Hub.Register.StartupHook('Sre Ready', function() {
  var FALSE, KEY;
  MathJax.Hub.Register.StartupHook('MathEvents Ready', function() {
    FALSE = MathJax.Extension.MathEvents.Event.False;
    KEY = MathJax.Extension.MathEvents.Event.KEY;
  });

  var Explorer = MathJax.Extension.Explorer = {
    enriched: [],
    speechDiv: null,
    //
    // Collates all enriched jaxs and adds a key event.
    //
    Register: function(msg) {
      var script = msg[1];
      if (script && script.id) {
        var jax = MathJax.Hub.getJaxFor(script.id);
        if (jax && jax.enriched) {
          Explorer.enriched.push(jax);
          Explorer.AddEvent(script);
        }
      }
    },
    //
    // Adds a key event to an enriched jax.
    //
    AddEvent: function(script) {
      if (script.previousSibling) {
        var math = script.previousSibling.firstElementChild;
        if (math) {
          math.onkeydown = Explorer.Keydown;
          return;
        }
      }
      MathJax.Hub.Queue(['AddEvent', Explorer, script]);
    },
    walker: null,
    currentHighlight: null,
    //
    // Event execution on keydown. Subsumes the same method of MathEvents.
    //
    Keydown: function(event) {
      if (event.keyCode === KEY.ESCAPE) {
        if (!Explorer.walker) return;
        Explorer.DeactivateWalker();
        FALSE(event);
        return;
      }
      // If walker is active we redirect there.
      if (Explorer.walker && Explorer.walker.isActive()) {
        var move = Explorer.walker.move(event.keyCode);
        if (move === null) return;
        if (move) {
          Explorer.Speak(Explorer.walker.speech());
          Explorer.Highlight();
        }
        FALSE(event);
        return;
      }
      var math = event.target;
      if (event.keyCode === KEY.SPACE) {
        if (event.shiftKey) {
          Explorer.ActivateWalker(math);
        } else {
          MathJax.Extension.MathEvents.Event.ContextMenu(event, math);
        }
        FALSE(event);
        return;
      }
    },
    //TODO: REFACTOR NOTES
    // -- Walker factory wrt global config.
    // -- Colour selector for highlighting with enum element.
    //
    // Activates the walker.
    //
    ActivateWalker: function(math) {
      Explorer.AddSpeech(math);
      var speechGenerator = new sre.DirectSpeechGenerator();
      Explorer.walker = new sre.SyntaxWalker(math, speechGenerator);
      Explorer.walker.activate();
      Explorer.Speak(Explorer.walker.speech());
      Explorer.Highlight();
    },
    //
    // Deactivates the walker.
    //
    DeactivateWalker: function() {
      Explorer.RemoveSpeech();
      Explorer.Unhighlight();
      Explorer.currentHighlight = null;
      Explorer.walker.deactivate();
      Explorer.walker = null;
    },
    //TODO: REFACTOR NOTES
    // -- Cache the mstyle element as it does not change.
    // -- Cache the SVG rectangle and only update bbox + transform.
    // -- Rewrite switch into a selector dictionary.
    // -- Highlight factory with renderer specific highlight classes.
    //
    // Highlights the current node.
    //
    Highlight: function() {
      Explorer.Unhighlight();
      var node = Explorer.walker.getCurrentNode();
      switch (MathJax.Hub.config.MathMenu.settings.renderer) {
      case 'SVG':
        var bbox = node.getBBox();
        var rect = document.createElementNS(
            'http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', bbox.x);
        rect.setAttribute('y', bbox.y);
        rect.setAttribute('width', bbox.width);
        rect.setAttribute('height', bbox.height);
        var transform = node.getAttribute('transform');
        if (transform) {
          rect.setAttribute('transform', transform);
        }
        rect.setAttribute('fill', 'rgba(0,0,255,.2)');
        node.parentNode.insertBefore(rect, node);
        Explorer.currentHighlight = rect;
        break;
      case 'NativeMML':
        var style = document.createElementNS(
          'http://www.w3.org/1998/Math/MathML', 'mstyle');
        style.setAttribute('mathbackground', '#33CCFF');
        node.parentNode.replaceChild(style, node);
        style.appendChild(node);
        Explorer.currentHighlight = style;
        break;
      case 'HTML-CSS':
      case 'CommonHTML':
        node.style.backgroundColor = 'rgba(0,0,255,.2)';
        Explorer.currentHighlight = node;
        break;
      default:
      }
    },
    //
    // Unhighlights the old node.
    //
    Unhighlight: function() {
      if (!Explorer.currentHighlight) return;
      switch (MathJax.Hub.config.MathMenu.settings.renderer) {
      case 'SVG':
        Explorer.currentHighlight.parentNode.removeChild(
            Explorer.currentHighlight);
      case 'NativeMML':
        Explorer.currentHighlight.parentNode.replaceChild(
          Explorer.currentHighlight.firstElementChild,
          Explorer.currentHighlight);
      case 'HTML-CSS':
      case 'CommonHTML':
        Explorer.currentHighlight.style.backgroundColor = 'rgba(0,0,0,0)';
      default:
      }
    },
    //
    // Adds the speech div.
    //
    AddSpeech: function(math) {
      if (!Explorer.speechDiv) {
        Explorer.speechDiv = MathJax.HTML.addElement(
            document.body, 'div', {className: 'MathJax_SpeechOutput',
              // style: {fontSize: '1px', color: '#FFFFFF'}}
            style: {fontSize: '12px', color: '#000000'}}
            );
        Explorer.speechDiv.setAttribute('aria-live', 'assertive');
      }
    },
    //
    // Removes the speech div.
    //
    RemoveSpeech: function() {
      if (Explorer.speechDiv) {
        Explorer.speechDiv.parentNode.removeChild(Explorer.speechDiv);
      }
      Explorer.speechDiv = null;
    },
    //
    // Speaks a string by poking it into the speech div.
    //
    Speak: function(speech) {
      Explorer.speechDiv.textContent = speech;
    }
  };

  MathJax.Hub.Register.MessageHook('End Math',
                                   ['Register', MathJax.Extension.Explorer]);

});
