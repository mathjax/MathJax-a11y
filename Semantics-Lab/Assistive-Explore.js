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
    walker: null,
    highlighter: null,
    hoverer: null,
    speechDiv: null,
    enriched: {},
    //
    // Registers new Maths and adds a key event if it is enriched.
    //
    Register: function(msg) {
      var script = document.getElementById(msg[1]);
      if (script && script.id) {
        var jax = MathJax.Hub.getJaxFor(script.id);
        if (jax && jax.enriched) {
          Explorer.enriched[script.id] = script;
          Explorer.AddEvent(script);
        }
      }
    },
    //TODO: Find the top-most elements (there can be multiple) and destroy
    // highlighter on mouse out only.
    // 
    GetHoverer: function() {
      Explorer.hoverer = sre.HighlighterFactory.highlighter(
        {color: Lab.background, alpha: .1},
        {color: Lab.foreground, alpha: 1},
        {renderer: MathJax.Hub.outputJax['jax/mml'][0].id,
         mode: 'hover', browser: MathJax.Hub.Browser.name}
      );
    },
    MouseOver: function(event) {
      var frame = event.currentTarget;
      Explorer.GetHoverer();
      Explorer.hoverer.highlight([frame]);
      return  MathJax.Extension.MathEvents.Event.False(event);
    },
    MouseOut: function (event) {
      Explorer.hoverer.unhighlight();
      return  MathJax.Extension.MathEvents.Event.False(event);
    },
    //TODO: Add counter to give up eventually.
    // 
    // 
    //
    // Adds mouse events to maction items in an enriched jax.
    // 
    // NOTE: Native MML does not work in Firefox due to MathML not implementing
    // the GlobalEventHandlers Interface.
    //
    AddMouseEvents: function(node) {
      var mactions = Explorer.GetMactionNodes(node);
      for (var i = 0, maction; maction = mactions[i]; i++) {
        switch (MathJax.Hub.outputJax['jax/mml'][0].id) {
        case 'NativeMML':
        case 'HTML-CSS':
          maction.childNodes[0].onmouseover =
            maction.childNodes[1].onmouseover = Explorer.MouseOver;
          maction.childNodes[0].onmouseout =
            maction.childNodes[1].onmouseout = Explorer.MouseOut;
          break;
        case 'CommonHTML':
          maction.onmouseover = Explorer.MouseOver;
          maction.onmouseout = Explorer.MouseOut;
          break;
        default:
          break;
        }
      }
    },
    GetMactionNodes: function(node) {
      switch (MathJax.Hub.outputJax['jax/mml'][0].id) {
      case 'NativeMML': 
        return node.getElementsByTagName('maction');
      case 'HTML-CSS':
        return node.getElementsByClassName('maction');
      case 'CommonHTML':
        return node.getElementsByClassName('mjx-maction');
      default:
        return [];
      }
     },
    //
    // Adds a key event to an enriched jax.
    //
    AddEvent: function(script) {
      var id = script.id + '-Frame';
      var sibling = script.previousSibling;
      if (sibling) {
        var math = sibling.id !== id ? sibling.firstElementChild : sibling;
        Explorer.AddMouseEvents(math);
        if (math.className === 'MathJax_MathML') {
          math = math.firstElementChild;
        }
        if (math) {
          math.onkeydown = Explorer.Keydown;
          return;
        }
      }
      MathJax.Hub.Queue(['AddEvent', Explorer, script]);
    },
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
      Explorer.walker = new sre.SemanticWalker(math, speechGenerator);
      Explorer.highlighter = sre.HighlighterFactory.highlighter(
          MathJax.Hub.outputJax['jax/mml'][0].id,
          {color: Lab.background, alpha: .2},
          {color: Lab.foreground, alpha: 1},
          {renderer: MathJax.Hub.outputJax['jax/mml'][0].id,
           mode: 'walk', browser: MathJax.Hub.Browser.name}
      );
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
    //
    // Highlights the focused nodes.
    //
    Highlight: function() {
      Explorer.Unhighlight();
      Explorer.highlighter.highlight(Explorer.walker.getFocus().getNodes());
    },
    //
    // Unhighlights the old nodes.
    //
    Unhighlight: function() {
      Explorer.highlighter.unhighlight();
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

  MathJax.Hub.Register.MessageHook(
      'New Math', ['Register', MathJax.Extension.Explorer]);

});
