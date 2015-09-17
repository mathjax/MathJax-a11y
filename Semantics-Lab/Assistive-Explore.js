

(function() {
  var FALSE, KEY;
  MathJax.Hub.Register.StartupHook("MathEvents Ready",function () {
    FALSE = MathJax.Extension.MathEvents.Event.False;
    KEY = MathJax.Extension.MathEvents.Event.KEY;
  });

  var Explorer = MathJax.Extension.Explorer = {
    enriched: [],
    active: [],
    speechDiv: null,
    //
    // Collates all enriched jaxs.
    //
    Register: function(jax, id, script) {
      if (jax.enriched) {
        Explorer.enriched.push(jax);
      };
    },
    //
    // Adds key events to each enriched jax.
    //
    AddEvents: function() {
      for (var i = 0, jax; jax = Explorer.enriched[i]; i++) {
        // This is costly! Can I do this also by walking back from script?
        var frame = document.getElementById(jax.inputID + '-Frame');
        if (frame) {
          Explorer.AddEvent(frame);
          Explorer.active.push(jax);
        }
      }
      if (Explorer.enriched.length !== Explorer.active.length) {
        MathJax.Hub.Queue(["AddEvents", Explorer]);
      }
    },
    //
    // Adds a single key event.
    //
    AddEvent: function(element) {
      element.onkeydown = Explorer.Keydown;
    },
    // 
    // Event execution on keydown. Subsumes the same method of MathEvents.
    //
    Keydown: function (event) {
      if (event.keyCode === KEY.SPACE) {
        var math = event.target;
        if (event.shiftKey) {
          Explorer.AddSpeech(math);
          var speechNode = Explorer.GetRoot(math);
          Explorer.Speak(speechNode.getAttribute('data-semantic-speech'));
        } else {
          MathJax.Extension.MathEvents.Event.ContextMenu(event, math);
        }
      } else if (event.keyCode === KEY.ESCAPE) {
        Explorer.RemoveSpeech();
      }
      FALSE(event);
    },
    //
    // Adds the speech div.
    //
    AddSpeech: function(math) {
      if (!Explorer.speechDiv) {
        Explorer.speechDiv = MathJax.HTML.addElement(
          document.body, "div", {className:"MathJax_SpeechOutput",
                                 style: {fontSize: '1px', color: '#FFFFFF'}});
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
    },
    //
    //
    //
    GetRoot: function(math) {
      var speechNodes = math.querySelectorAll('span[data-semantic-speech]');
      for (var i = 0, speechNode; speechNode = speechNodes[i]; i++) {
        if (!speechNode.hasAttribute('data-semantic-parent')) {
          return speechNode;
        }
      }
      return speechNodes[0];
    }
  };
  
  MathJax.Hub.postInputHooks.Add(["Register", Explorer], 200);

  MathJax.Hub.Register.MessageHook("End Math",
                                   ["AddEvents", MathJax.Extension.Explorer]);

})();
