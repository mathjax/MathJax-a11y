//
// Connection to SRE explorer.
//

MathJax.Hub.Register.StartupHook("Sre Ready", function() {
  var FALSE, KEY;
  MathJax.Hub.Register.StartupHook("MathEvents Ready",function () {
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
      };
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
      MathJax.Hub.Queue(["AddEvent", Explorer, script]);
    },
    // 
    // Event execution on keydown. Subsumes the same method of MathEvents.
    //
    Keydown: function (event) {
      if (event.keyCode === KEY.SPACE) {
        var math = event.target;
        if (event.shiftKey) {
          //TODO: (sorge) Hook up the actual explorer here.
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
    // Retrieves the root node of the semantic tree.
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
  
  MathJax.Hub.Register.MessageHook("End Math",
                                   ["Register", MathJax.Extension.Explorer]);

});
