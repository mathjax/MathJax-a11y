//
// Connection to SRE explorer.
//
MathJax.Hub.Register.StartupHook('Sre Ready', function() {
  var FALSE, KEY;
  var SETTINGS = MathJax.Hub.config.menuSettings;

  MathJax.Hub.Register.StartupHook('MathEvents Ready', function() {
    FALSE = MathJax.Extension.MathEvents.Event.False;
    KEY = MathJax.Extension.MathEvents.Event.KEY;
  });

  var Assistive = MathJax.Extension.Assistive = {
    //
    // Default configurations.
    //
    default: {
      walker: 'dummy',
      highlight: 'none',
      background: 'blue',
      foreground: 'black',
      speech: true,
      subtitle: true,
      // Configuration option only.
      generateSpeech: true
    },
    prefix: 'Assistive-',
    
    addMenuOption: function(key, value) {
      SETTINGS[Assistive.prefix + key] = value;      
    },

    addDefaults: function() {
      for (var key in Assistive.default) {
        if (typeof(SETTINGS[Assistive.prefix + key]) === 'undefined') {
          Assistive.addMenuOption(key, Assistive.default[key]);
        }
      }
      Explorer.Reset();
    },

    setOption: function(key, value) {
      if (SETTINGS[Assistive.prefix + key] === value) return;
      Assistive.addMenuOption(key, value);
      Explorer.Reset();
    },

    getOption: function(key) {
      return SETTINGS[Assistive.prefix + key];
    }
    
  };
  
  var LiveRegion = MathJax.Object.Subclass({
    version: "1.0",
    
    div: null,
    inner: null,
    Init: function() {
      this.div = LiveRegion.Create('assertive', LiveRegion.hidden);
      this.inner = MathJax.HTML.addElement(this.div,'div');
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
    // Shows the live region as a subtitle of a node.
    //
    Show: function(node, highlighter) {
      for (var key in LiveRegion.subtitle) {
        this.div.style[key] = LiveRegion.subtitle[key];
      }
      var rect = node.getBoundingClientRect();
      var bot = rect.bottom + 10 + window.pageYOffset;
      var left = rect.left + window.pageXOffset;
      this.div.style.top = bot + 'px';
      this.div.style.left = left + 'px';
      var color = highlighter.colorString();
      this.inner.style.backgroundColor = color.background;
      this.inner.style.color = color.foreground;
    },
    //
    // Takes the live region out of the page flow.
    //
    Hide: function(node) {
      for (var key in LiveRegion.hidden) {
        this.div.style[key] = LiveRegion.hidden[key];
      }
    },
    //
    // Clears the speech div.
    //
    Clear: function() {
      this.Update('');
      this.inner.style.top = '';
      this.inner.style.backgroundColor = '';
    },
    //
    // Speaks a string by poking it into the speech div.
    //
    Update: function(speech) {
      if (Assistive.getOption('speech')) {
        LiveRegion.Update(this.inner, speech);
      }
    }
  }, {
    ANNOUNCE: 'Navigatable Math in page. Explore with shift space.',
    announced: false,
    hidden: {position: 'absolute', top:'0', height: '1px', width: '1px',
             padding: '1px', overflow: 'hidden'},
    subtitle: {position: 'absolute', width: 'auto', height: 'auto',
               padding: '5px 0px', opacity: 1, 'z-index': '202',
               left: 0, right: 0, 'margin': '0 auto',
               backgroundColor: 'white'
              },

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
      LiveRegion.announced = true;
      var div = LiveRegion.Create('polite', LiveRegion.hidden);
      document.body.appendChild(div);
      LiveRegion.Update(div, LiveRegion.ANNOUNCE);
      setTimeout(function() {document.body.removeChild(div);}, 1000);
    }
  });
  MathJax.Extension.Assistive.LiveRegion = LiveRegion;
  
  var Explorer = MathJax.Extension.Assistive.Explorer = {
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
    // Resets the explorer, rerunning methods not triggered by events.
    //
    Reset: function() {
      Explorer.FlameEnriched();
      sre.Engine.getInstance().speech = Assistive.getOption('generateSpeech');
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
        if (math.className === 'MathJax_MathML') {
          math = math.firstElementChild;
        }
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
        {color: Assistive.getOption('background'), alpha: alpha},
        {color: Assistive.getOption('foreground'), alpha: 1},
        {renderer: MathJax.Hub.outputJax['jax/mml'][0].id,
         browser: MathJax.Hub.Browser.name}
      );
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
      if (Assistive.getOption('highlight') === 'none') return;
      if (Assistive.getOption('highlight') === 'hover') {
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
      if (Assistive.getOption('highlight') === 'flame') {
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
      var constructor = Explorer.Walkers[Assistive.getOption('walker')] ||
            Explorer.Walkers['dummy'];
      Explorer.walker = new constructor(math, speechGenerator);
      Explorer.GetHighlighter(.2);
      Explorer.walker.activate();
      if (Assistive.getOption('subtitle')) {
        Explorer.liveRegion.Show(math, Explorer.highlighter);
      }
      Explorer.liveRegion.Update(Explorer.walker.speech());
      Explorer.Highlight();
    },
    //
    // Deactivates the walker.
    //
    DeactivateWalker: function() {
      Explorer.liveRegion.Clear();
      Explorer.liveRegion.Hide();
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

  MathJax.Extension.Assistive.addDefaults();

  MathJax.Hub.Register.StartupHook('MathMenu Ready', function() {
    var ITEM = MathJax.Menu.ITEM;
    var accessibiltyMenu =
          ITEM.SUBMENU(['Accessibility', 'Accessibilty'],
              ITEM.SUBMENU(['Walker', 'Walker'],
                  ITEM.RADIO(['dummy', 'Dummy walker'], 'Assistive-walker'),
                  ITEM.RADIO(['syntactic', 'Syntax walker'], 'Assistive-walker'),
                  ITEM.RADIO(['semantic', 'Semantic walker'], 'Assistive-walker')
                          ),
              ITEM.SUBMENU(['Highlight', 'Highlight'],
                           ITEM.RADIO(['none', 'None'], 'Assistive-highlight'),
                           ITEM.RADIO(['hover', 'Hover'], 'Assistive-highlight'),
                           ITEM.RADIO(['flame','Flame'], 'Assistive-highlight', {action: Explorer.Reset})
                          ),
              ITEM.SUBMENU(['Background', 'Background'],
                           ITEM.RADIO(['blue','Blue'], 'Assistive-background', {action: Explorer.Reset}),
                           ITEM.RADIO(['red','Red'], 'Assistive-background', {action: Explorer.Reset}),
                           ITEM.RADIO(['green','Green'], 'Assistive-background', {action: Explorer.Reset}),
                           ITEM.RADIO(['yellow','Yellow'], 'Assistive-background', {action: Explorer.Reset}),
                           ITEM.RADIO(['cyan','Cyan'], 'Assistive-background', {action: Explorer.Reset}),
                           ITEM.RADIO(['magenta','Magenta'], 'Assistive-background', {action: Explorer.Reset}),
                           ITEM.RADIO(['white','White'], 'Assistive-background', {action: Explorer.Reset}),
                           ITEM.RADIO(['black','Black'], 'Assistive-background', {action: Explorer.Reset})
                          ),
              ITEM.SUBMENU(['Foreground', 'Foreground'],
                           ITEM.RADIO(['black','Black'], 'Assistive-foreground', {action: Explorer.Reset}),
                           ITEM.RADIO(['white','White'], 'Assistive-foreground', {action: Explorer.Reset}),
                           ITEM.RADIO(['magenta','Magenta'], 'Assistive-foreground', {action: Explorer.Reset}),
                           ITEM.RADIO(['cyan','Cyan'], 'Assistive-foreground', {action: Explorer.Reset}),
                           ITEM.RADIO(['yellow','Yellow'], 'Assistive-foreground', {action: Explorer.Reset}),
                           ITEM.RADIO(['green','Green'], 'Assistive-foreground', {action: Explorer.Reset}),
                           ITEM.RADIO(['red','Red'], 'Assistive-foreground', {action: Explorer.Reset}),
                           ITEM.RADIO(['blue','Blue'], 'Assistive-foreground', {action: Explorer.Reset})
                          ),
              ITEM.RULE(),
              ITEM.CHECKBOX(['Speech', 'Speech Output'], 'Assistive-speech'),
              ITEM.CHECKBOX(['Subtitles', 'Subtitles'], 'Assistive-subtitle')
                      );
    MathJax.Menu.menu.items.push(ITEM.RULE());
    MathJax.Menu.menu.items.push(accessibiltyMenu);
  });

  MathJax.Hub.Register.MessageHook('New Math', ['Register', MathJax.Extension.Assistive.Explorer]);

  MathJax.Hub.Startup.signal.Post("Explorer Ready");
});

MathJax.Ajax.loadComplete("[RespEq]/Assistive-Explore.js");
