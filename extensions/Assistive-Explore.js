//
// Connection to SRE explorer.
//
MathJax.Hub.Register.StartupHook('Sre Ready', function() {
  var FALSE, KEY;
  MathJax.Hub.Register.StartupHook('MathEvents Ready', function() {
    FALSE = MathJax.Extension.MathEvents.Event.False;
    KEY = MathJax.Extension.MathEvents.Event.KEY;
  });



  var LiveRegion = MathJax.Extension.LiveRegion = MathJax.Object.Subclass({
    version: "1.0",
    
    div: null,
    Init: function() {
      this.div = LiveRegion.Create('assertive');
    },
    //
    // Adds the speech div.
    //
    Add: function() {
      if (LiveRegion.announced) return;
      document.body.appendChild(this.div);
      LiveRegion.Announce();
    },
    //
    // Clears the speech div.
    //
    Clear: function() {
      this.Update('');
    },
    //
    // Speaks a string by poking it into the speech div.
    //
    Update: function(speech) {
      LiveRegion.Update(this.div, speech);
    }
  }, {
    ANNOUNCE: 'Navigatable Math in page. Explore with shift space.',
    announced: false,
    //
    // Creates a live region with a particular type and display style.
    //
    Create: function(type, style) {
      var element = MathJax.HTML.Element(
        'div', {className: 'MathJax_SpeechOutput', style: style});
      element.setAttribute('aria-live', type);
      return element;
    },
    //
    // Updates a live region's text content.
    //
    Update: MathJax.Hub.Browser.isPC ?
      function(div, speech) {
        div.textContent = '';
        setTimeout(function() {div.textContent = speech;}, 100);
      } : function(div, speech) {
        div.textContent = speech;
      },
    //
    // Speaks the announce string.
    //
    Announce: function() {
      if (LiveRegion.announced) return;
      LiveRegion.announeced = true;
      var div = LiveRegion.Create('polite',
                                  {fontSize: '1px', color: '#FFFFFF'});
      document.body.appendChild(div);
      LiveRegion.Update(div, LiveRegion.ANNOUNCE);
      setTimeout(function() {document.body.removeChild(div);}, 1000);
    }
  });
  
  
  var Explorer = MathJax.Extension.Explorer = {
    version: "1.0",
    
    liveRegion: LiveRegion(),
    walker: null,
    highlighter: null,
    hoverer: null,
    flamer: null,
    speechDiv: null,
    enriched: {},
    earconFile: location.protocol +
      '//progressiveaccess.com/content/invalid_keypress' +
      (['Firefox', 'Chrome', 'Opera'].indexOf(MathJax.Hub.Browser.name) !== -1 ?
       '.ogg' : '.mp3'),
    focusEvent: MathJax.Hub.Browser.isFirefox ? 'blur' : 'focusout',
    //
    // Configurations.
    //
    config: {
      walker: 'dummy',
      highlight: 'none',
      background: 'blue',
      foreground: 'black',
      speech: true
    },
    setExplorerOption: function(key, value) {
      if (Explorer.config[key] === value) return;
      Explorer.config[key] = value;
      Explorer.Reset();
    },
    //
    // Resets the explorer, rerunning methods not triggered by events.
    //
    Reset: function() {
      Explorer.FlameEnriched();
      sre.Engine.getInstance().mathmlSpeech = Explorer.config.speech;
    },
    //
    // Registers new Maths and adds a key event if it is enriched.
    //
    Register: function(msg) {
      var script = document.getElementById(msg[1]);
      if (script && script.id) {
        var jax = MathJax.Hub.getJaxFor(script.id);
        if (jax && jax.enriched) {
          Explorer.enriched[script.id] = script;
          Explorer.liveRegion.Add();
          Explorer.AddEvent(script);
        }
      }
    },
    //
    // Adds Aria attributes.
    //
    AddAria: function(math) {
      math.setAttribute('role', 'application');
      math.setAttribute('aria-label', 'Math');
    },
    //
    // Adds a key event to an enriched jax.
    //


    AddEvent: function(script) {
      var id = script.id + '-Frame';
      var sibling = script.previousSibling;
      if (sibling) {
        var math = sibling.id !== id ? sibling.firstElementChild : sibling;
        Explorer.AddAria(math);
        Explorer.AddMouseEvents(math);
        Explorer.AddHammerGestures(math);
        //Explorer.AddTouchEvents(math);
        if (math.className === 'MathJax_MathML') {
          math = math.firstElementChild;
        }
        //$math.bind('tapone', function(event){console.log("tapped!")})
        if (math) {
          math.onkeydown = Explorer.Keydown;
          math.addEventListener(
            Explorer.focusEvent,
            function(event) {
              if (Explorer.walker) Explorer.DeactivateWalker();
            });
          return;
        }
      }
      MathJax.Hub.Queue(['AddEvent', Explorer, script]);
    },
    //
    // Event execution on keydown. Subsumes the same method of MathEvents.
    //
    AddHammerGestures: function(node) {
      console.log('Adding Hammer Horror');
      var mc = new Hammer(node);
      console.log('Still alive?');
      console.log(mc);
      mc.on("panleft panright tap press", function(ev) {
        console.log(ev.type +" gesture detected.");
      });
      mc.on("tap", this.HammerTap);
      mc.on("panleft", this.HammerSwipeLeft);
      mc.on("panright", this.HammerSwipeRight);
      mc.on("panup", this.HammerSwipeUp);
      mc.on("pandown", this.HammerSwipeDown);
    },

    HammerTap: function(event){
      if (Explorer.walker && Explorer.walker.isActive()) {
        //Explorer.DeactivateWalker();
      };
      var math = event.target;
      Explorer.ActivateWalker(math);
      console.log(math);
      
    },

    HammerSwipeLeft: function(event){
      if (Explorer.walker && Explorer.walker.isActive()) {
        var move = Explorer.walker.left();
        if (move === null) return;
        if (move) {
          Explorer.liveRegion.Update(Explorer.walker.speech());
          Explorer.Highlight();
        } else {
          Explorer.PlayEarcon();
        }
        FALSE(event);
        return;
       } else {
        console.log("Walker Not activated");
          //HammerTap(event);
       }
    },

    HammerSwipeRight: function(event){
      if (Explorer.walker && Explorer.walker.isActive()) {
        var move = Explorer.walker.right();
        if (move === null) return;
        if (move) {
          Explorer.liveRegion.Update(Explorer.walker.speech());
          Explorer.Highlight();
        } else {
          Explorer.PlayEarcon();
        }
        FALSE(event);
        return;
       } else {
        console.log("Walker Not activated");
          //HammerTap(event);
       }
    },

    HammerSwipeUp: function(event){
      if (Explorer.walker && Explorer.walker.isActive()) {
        var move = Explorer.walker.up();
        if (move === null) return;
        if (move) {
          Explorer.liveRegion.Update(Explorer.walker.speech());
          Explorer.Highlight();
        } else {
          Explorer.PlayEarcon();
        }
        FALSE(event);
        return;
       } else {
        console.log("Walker Not activated");
          //HammerTap(event);
       }
    },

    HammerSwipeDown: function(event){
      if (Explorer.walker && Explorer.walker.isActive()) {
        var move = Explorer.walker.down();
        if (move === null) return;
        if (move) {
          Explorer.liveRegion.Update(Explorer.walker.speech());
          Explorer.Highlight();
        } else {
          Explorer.PlayEarcon();
        }
        FALSE(event);
        return;
       } else {
        console.log("Walker Not activated");
          //HammerTap(event);
       }
    },

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
        console.log(event.keyCode);
        if (move === null) return;
        if (move) {
          Explorer.liveRegion.Update(Explorer.walker.speech());
          Explorer.Highlight();
        } else {
          Explorer.PlayEarcon();
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
    GetHighlighter: function(alpha) {
      Explorer.highlighter = sre.HighlighterFactory.highlighter(
        {color: Explorer.config.background, alpha: alpha},
        {color: Explorer.config.foreground, alpha: 1},
        {renderer: MathJax.Hub.outputJax['jax/mml'][0].id,
         browser: MathJax.Hub.Browser.name}
      );
    },
    //
    // Adds touch event to action items in an enriched jax.
    //
    
    
    AddTouchEvents: function(node) {
      sre.HighlighterFactory.addEvents(
        node,
        {'jgesture.tapone': Explorer.TapOne,
          'touchstart': Explorer.TouchStart,
         'touchend': Explorer.TouchEnd},
        {renderer: MathJax.Hub.outputJax['jax/mml'][0].id,
         browser: MathJax.Hub.Browser.name}
      );
    },
    //TouchStart: function(event){
    //  event.preventDefault();
    //  if (Explorer.hoverer) {
    //    Explorer.highlighter.unhighlight();
    //    Explorer.hoverer = false;
    // }
    //  if (Explorer.config.highlight === 'none') return;
    //  if (Explorer.config.highlight === 'hover') {
    //    var frame = event.currentTarget;
    //   Explorer.GetHighlighter(.1);
    //   Explorer.highlighter.highlight([frame]);
    //    Explorer.hoverer = true;
    //  }
    //  MathJax.Extension.MathEvents.Event.False(event);


    //},
    

    TouchStart: function(event){
      event.preventDefault();

      if (Explorer.walker && Explorer.walker.isActive()) {
        Explorer.DeactivateWalker();
      };
      var math = event.target;
      Explorer.ActivateWalker(math);
      console.log(math);
      },


    TouchEnd: function(event){
      //event.preventDefault();
    },

    //
    // Adds mouse events to maction items in an enriched jax.
    //
    AddMouseEvents: function(node) {
      sre.HighlighterFactory.addEvents(
        node,
        {'mouseover': Explorer.MouseOver,
         'mouseout': Explorer.MouseOut},
        {renderer: MathJax.Hub.outputJax['jax/mml'][0].id,
         browser: MathJax.Hub.Browser.name}
      );
    },
    MouseOver: function(event) {
      if (Explorer.config.highlight === 'none') return;
      if (Explorer.config.highlight === 'hover') {
        var frame = event.currentTarget;
        Explorer.GetHighlighter(.1);
        Explorer.highlighter.highlight([frame]);
        Explorer.hoverer = true;
      }
      MathJax.Extension.MathEvents.Event.False(event);
    },
    MouseOut: function (event) {
      if (Explorer.hoverer) {
        Explorer.highlighter.unhighlight();
        Explorer.hoverer = false;
      }
      return MathJax.Extension.MathEvents.Event.False(event);
    },
    //
    // Activates Flaming
    //
    Flame: function(node) {
      Explorer.UnFlame(node);
      if (Explorer.config.highlight === 'flame') {
        Explorer.GetHighlighter(.05);
        Explorer.highlighter.highlightAll(node);
        Explorer.flamer = true;
        return;
      }
    },
    UnFlame: function(node) {
      if (Explorer.flamer) {
        Explorer.highlighter.unhighlightAll();
        Explorer.flamer = null;
      }
    },
    FlameEnriched: function() {
      for (var key in Explorer.enriched) {
        Explorer.Flame(Explorer.enriched[key].previousSibling);
      }
    },
    // 
    // Activates the walker.
    //
    Walkers: {
      'syntactic': sre.SyntaxWalker,
      'semantic': sre.SemanticWalker,
      'dummy': sre.DummyWalker
    },
    ActivateWalker: function(math) {
      var speechGenerator = new sre.DirectSpeechGenerator();
      var constructor = Explorer.Walkers[Explorer.config.walker] ||
            Explorer.Walkers['dummy'];
      Explorer.walker = new constructor(math, speechGenerator);
      Explorer.GetHighlighter(.2);
      Explorer.walker.activate();
      Explorer.liveRegion.Update(Explorer.walker.speech());
      Explorer.Highlight();
    },
    //
    // Deactivates the walker.
    //
    DeactivateWalker: function() {
      Explorer.liveRegion.Clear();
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
    // Plays the earcon.
    //
    // Every time we make new Audio element, as some browsers do not allow to
    // play audio elements more than once (e.g., Safari).
    //
    PlayEarcon: function() {
      var audio = new Audio(Explorer.earconFile);
      audio.play();
    }
  };

  MathJax.Hub.Register.MessageHook('New Math', ['Register', MathJax.Extension.Explorer]);

  MathJax.Hub.Startup.signal.Post("Explorer Ready");
});

MathJax.Ajax.loadComplete("[RespEq]/Assistive-Explore.js");
