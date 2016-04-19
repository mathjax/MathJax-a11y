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
    version: "1.0",
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
      ruleset: 'mathspeak-default'
    },
    prefix: 'Assistive-',
    hook: null,
    oldrules: null,
    addMenuOption: function(key, value) {
      SETTINGS[Assistive.prefix + key] = value;      
    },

    addDefaults: function() {
      var keys = Object.keys(Assistive.default);
      for (var i = 0, key; key = keys[i]; i++) {
        if (typeof(SETTINGS[Assistive.prefix + key]) === 'undefined') {
          Assistive.addMenuOption(key, Assistive.default[key]);
        }
      }
      Assistive.setSpeechOption();
      Explorer.Reset();
    },

    setOption: function(key, value) {
      if (SETTINGS[Assistive.prefix + key] === value) return;
      Assistive.addMenuOption(key, value);
      Explorer.Reset();
    },

    getOption: function(key) {
      return SETTINGS[Assistive.prefix + key];
    },
    
    speechOption: function(msg) {
      if (Assistive.oldrules === msg.value) return;
      Assistive.setSpeechOption();
      Explorer.Regenerate();
    },

    setSpeechOption: function() {
      var ruleset = SETTINGS[Assistive.prefix + 'ruleset'];
      var cstr = ruleset.split('-');
      sre.System.getInstance().setupEngine({
        domain: cstr[0],
        style: cstr[1]
      });
      Assistive.oldrules = ruleset;
    }
    
  };
  
  var LiveRegion = MathJax.Object.Subclass({
    div: null,
    inner: null,
    Init: function() {
      this.div = LiveRegion.Create('assertive');
      this.inner = MathJax.HTML.addElement(this.div,'div');
    },
    //
    // Adds the speech div.
    //
    Add: function() {
      if (LiveRegion.added) return;
      document.body.appendChild(this.div);
      LiveRegion.added = true;
    },
    //
    // Shows the live region as a subtitle of a node.
    //
    Show: function(node, highlighter) {
      this.div.classList.add('MJX_LiveRegion_Show');
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
      this.div.classList.remove('MJX_LiveRegion_Show');
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
    ANNOUNCE: 'Navigatable Math in page. Explore with shift space and arrow' +
      ' keys. Expand or collapse elements hitting enter.',
    announced: false,
    added: false,
    styles: {'.MJX_LiveRegion':
             {
               position: 'absolute', top:'0', height: '1px', width: '1px',
               padding: '1px', overflow: 'hidden'
             },
             '.MJX_LiveRegion_Show':
             {
               top:'0', position: 'absolute', width: 'auto', height: 'auto',
               padding: '0px 0px', opacity: 1, 'z-index': '202',
               left: 0, right: 0, 'margin': '0 auto',
               'background-color': 'white', 'box-shadow': '0px 10px 20px #888',
               border: '2px solid #CCCCCC'
             }
            },
    //
    // Creates a live region with a particular type.
    //
    Create: function(type) {
      var element = MathJax.HTML.Element(
        'div', {className: 'MJX_LiveRegion'});
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
        div.textContent = '';
        div.textContent = speech;
      },
    //
    // Speaks the announce string.
    //
    Announce: function() {
      if (!Assistive.getOption('speech')) return;
      LiveRegion.announced = true;
      MathJax.Ajax.Styles(LiveRegion.styles);
      var div = LiveRegion.Create('polite');
      document.body.appendChild(div);
      LiveRegion.Update(div, LiveRegion.ANNOUNCE);
      setTimeout(function() {document.body.removeChild(div);}, 1000);
    }
  });
  MathJax.Extension.Assistive.LiveRegion = LiveRegion;
  
  var Explorer = MathJax.Extension.Assistive.Explorer = {
    liveRegion: LiveRegion(),
    walker: null,
    highlighter: null,
    hoverer: null,
    flamer: null,
    speechDiv: null,
    earconFile: location.protocol +
      '//progressiveaccess.com/content/invalid_keypress' +
      (['Firefox', 'Chrome', 'Opera'].indexOf(MathJax.Hub.Browser.name) !== -1 ?
       '.ogg' : '.mp3'),
    expanded: false,
    focusoutEvent: MathJax.Hub.Browser.isFirefox ? 'blur' : 'focusout',
    focusinEvent: 'focus',
    jaxCache: {},
    //
    // Resets the explorer, rerunning methods not triggered by events.
    //
    Reset: function() {
      Explorer.FlameEnriched();
    },
    //
    // Registers new Maths and adds a key event if it is enriched.
    //
    Register: function(msg) {
      var script = document.getElementById(msg[1]);
      if (script && script.id) {
        var jax = MathJax.Hub.getJaxFor(script.id);
        if (jax && jax.enriched) {
          Explorer.StateChange(script.id, jax);
          Explorer.liveRegion.Add();
          Explorer.AddEvent(script);
        }
      }
    },
    StateChange: function(id, jax) {
      Explorer.GetHighlighter(.2);
      var oldJax = Explorer.jaxCache[id];
      if (oldJax && oldJax === jax.root) return;
      if (oldJax) {
        Explorer.highlighter.resetState(id + '-Frame');
      }
      Explorer.jaxCache[id] = jax.root;
    },
    //
    // Adds Aria attributes.
    //
    AddAria: function(math) {
      math.setAttribute('role', 'application');
      math.setAttribute('aria-label', 'Math');
    },
    //
    // Add hook to run at End Math to restart walking on an expansion element.
    //
    AddHook: function(jax) {
      Explorer.RemoveHook();
      Explorer.hook = MathJax.Hub.Register.MessageHook(
        'End Math', function(message) {
          var newid = message[1].id + '-Frame';
          var math = document.getElementById(newid);
          if (jax && newid === Explorer.expanded) {
            Explorer.ActivateWalker(math, jax);
            math.focus();
            Explorer.expanded = false;
          }
        });
    },
    //
    // Remove and unregister the explorer hook.
    //
    RemoveHook: function() {
      if (Explorer.hook) {
        MathJax.Hub.UnRegister.MessageHook(Explorer.hook);
        Explorer.hook = null;
      }
    },
    //
    // Adds a key event to an enriched jax.
    //
    AddEvent: function(script) {
      var id = script.id + '-Frame';
      var sibling = script.previousSibling;
      if (!sibling) return;
      var math = sibling.id !== id ? sibling.firstElementChild : sibling;
      Explorer.AddAria(math);
      Explorer.AddMouseEvents(math);
      if (math.className === 'MathJax_MathML') {
        math = math.firstElementChild;
      }
      if (!math) return;
      math.onkeydown = Explorer.Keydown;
      //
      setTimeout(function() {
        Explorer.AddSpeech(math, script);
      }, 5);
      //
      Explorer.Flame(math);
      math.addEventListener(
        Explorer.focusinEvent,        
        function(event) {
          if (!LiveRegion.announced) LiveRegion.Announce();
        });
      math.addEventListener(
        Explorer.focusoutEvent,
        function(event) {
          if (Explorer.walker) Explorer.DeactivateWalker();
        });
    },
    //
    // Adds speech strings to the node.
    // Could become a web worker!
    //
    AddSpeech: function(math, script) {
      var jax = MathJax.Hub.getJaxFor(script);
      var mathml = jax.root.toMathML();
      var speechGenerator = Assistive.getOption('speech') ?
            new sre.TreeSpeechGenerator() :
            new sre.DummySpeechGenerator();
      var dummy = new sre.DummyWalker(
          math, speechGenerator, Explorer.highlighter, mathml);
      dummy.speech();
      Explorer.AddMathLabel(math);
    },
    //
    // Attaches the Math expression as an aria label.
    //
    AddMathLabel: function(math) {
      if (!Assistive.getOption('speech')) return;
      var speechGenerator = new sre.DirectSpeechGenerator();
      var span = math.querySelector('[data-semantic-speech]');
      if (span) {
        setTimeout(function() {
          var speech = speechGenerator.getSpeech(span);
          if (speech) {
            math.setAttribute('aria-label', speech);
          }
        }, math.id === Explorer.expanded ? 100 : 0);
      }
    },
    // 
    // Event execution on keydown. Subsumes the same method of MathEvents.
    //
    Keydown: function(event) {
      if (event.keyCode === KEY.ESCAPE) {
        if (!Explorer.walker) return;
        Explorer.RemoveHook();
        Explorer.DeactivateWalker();
        FALSE(event);
        return;
      }
      // If walker is active we redirect there.
      if (Explorer.walker && Explorer.walker.isActive()) {
        var move = Explorer.walker.move(event.keyCode);
        if (move === null) return;
        if (move) {
          if (Explorer.walker.moved === 'expand') {
            Explorer.expanded = Explorer.walker.node.id;
            // Find out why this does not blur in FF.
            // Also test with IE, Safari!
            if (MathJax.Hub.Browser.isFirefox) {
              Explorer.DeactivateWalker();
              return;
            }
          }
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
          var jax = MathJax.Hub.getJaxFor(math);
          Explorer.ActivateWalker(math, jax);
          Explorer.AddHook(jax);
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
      if (Assistive.getOption('highlight') === 'flame') {
        Explorer.GetHighlighter(.05);
        Explorer.highlighter.highlightAll(node);
        Explorer.flamer = true;
        return;
      }
    },
    UnFlame: function() {
      if (Explorer.flamer) {
        Explorer.highlighter.unhighlightAll();
        Explorer.flamer = null;
      }
    },
    FlameEnriched: function() {
      Explorer.UnFlame();
      for (var i = 0, all = MathJax.Hub.getAllJax(), jax; jax = all[i]; i++) {
        Explorer.Flame(jax.SourceElement().previousSibling);
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
    ActivateWalker: function(math, jax) {
      var speechGenerator = new sre.DirectSpeechGenerator();
      var constructor = Explorer.Walkers[Assistive.getOption('walker')] ||
            Explorer.Walkers['dummy'];
      var mathml = jax.root.toMathML();
      Explorer.GetHighlighter(.2);
      Explorer.walker = new constructor(
          math, speechGenerator, Explorer.highlighter, mathml);
      Explorer.walker.activate();
      if (Assistive.getOption('speech')) {
        if (Assistive.getOption('subtitle')) {
          Explorer.liveRegion.Show(math, Explorer.highlighter);
        }
        Explorer.liveRegion.Update(Explorer.walker.speech());
      }
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
    },
    //
    // Regenerates speech.
    //
    Regenerate: function() {
      Explorer.Reset();
      var speechItems = ['Subtitles'];
      speechItems.forEach(
        function(x) {
          var item = MathJax.Menu.menu.FindId('Accessibility', x);
          if (item) {
            item.disabled = !item.disabled;
          }});
      for (var i = 0, all = MathJax.Hub.getAllJax(), jax; jax = all[i]; i++) {
        var script = document.getElementById(jax.inputID);
        var math = document.getElementById(jax.inputID + '-Frame');
        if (script) {
          Explorer.AddSpeech(math, script);
        }
      }
    }
  };

  MathJax.Extension.Assistive.addDefaults();

  MathJax.Hub.Register.StartupHook('MathMenu Ready', function() {
    var ITEM = MathJax.Menu.ITEM;
    var accessibilityMenu =
          ITEM.SUBMENU(['Accessibility', 'Accessibilty'],
              ITEM.SUBMENU(['Walker', 'Walker'],
                  ITEM.RADIO(['dummy', 'No walker'], 'Assistive-walker'),
                  ITEM.RADIO(['syntactic', 'Syntax walker'], 'Assistive-walker'),
                  ITEM.RADIO(['semantic', 'Semantic walker'], 'Assistive-walker')
                          ),
              ITEM.SUBMENU(['Highlight', 'Highlight'],
                           ITEM.RADIO(['none', 'None'], 'Assistive-highlight', {action: Explorer.Reset}),
                           ITEM.RADIO(['hover', 'Hover'], 'Assistive-highlight', {action: Explorer.Reset}),
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
              ITEM.CHECKBOX(['SpeechOutput', 'Speech Output'], 'Assistive-speech', {action: Explorer.Regenerate}),
              ITEM.CHECKBOX(['Subtitles', 'Subtitles'], 'Assistive-subtitle', {disabled: !SETTINGS['Assistive-speech']}),
              ITEM.RULE(),
              ITEM.SUBMENU(['Mathspeak', 'Mathspeak Rules'],
                           ITEM.RADIO(['mathspeak-default','Verbose'], 'Assistive-ruleset', {action: Assistive.speechOption}),
                           ITEM.RADIO(['mathspeak-brief','Brief'], 'Assistive-ruleset', {action: Assistive.speechOption}),
                           ITEM.RADIO(['mathspeak-sbrief','Superbrief'], 'Assistive-ruleset', {action: Assistive.speechOption})),
              ITEM.SUBMENU(['Chromevox', 'ChromeVox Rules'],
                           ITEM.RADIO(['chromevox-default','Verbose'], 'Assistive-ruleset', {action: Assistive.speechOption}),
                           ITEM.RADIO(['chromevox-short','Short'], 'Assistive-ruleset', {action: Assistive.speechOption}),
                           ITEM.RADIO(['chromevox-alternative','Alternative'], 'Assistive-ruleset', {action: Assistive.speechOption}))
                      );
    // Attaches the menu;
    var about = MathJax.Menu.menu.IndexOfId('About');
    if (about === null) {
      MathJax.Menu.menu.items.push(ITEM.RULE(), accessibilityMenu);
      return;
    }
    MathJax.Menu.menu.items.splice(about, 0, accessibilityMenu, ITEM.RULE());
  });

  MathJax.Hub.Register.MessageHook('New Math', ['Register', MathJax.Extension.Assistive.Explorer]);

  MathJax.Hub.Startup.signal.Post("Explorer Ready");
});

MathJax.Ajax.loadComplete("[RespEq]/Assistive-Explore.js");
