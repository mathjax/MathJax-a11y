//
// Thin hook to include the accessibility extension.
//
(function(HUB) {
  var SETTINGS = HUB.config.menuSettings;
  var ITEM = MathJax.Menu.ITEM;
  var MENU = MathJax.Menu.menu;
  
  var Accessibility = MathJax.Extension.Accessibility = {
    version: '1.0',
    default: {
      explorer: false,
      collapse: false
    },
    AddDefaults: function() {
      var keys = Object.keys(Accessibility.default);
      for (var i = 0, key; key = keys[i]; i++) {
        if (typeof(SETTINGS['Accessibility-' + key]) === 'undefined') {
          SETTINGS['Accessibility-' + key] =
            Accessibility.default[key];
        }
      }
    },
    GetOption: function(option) {
      return SETTINGS['Accessibility-' + option];
    },
    SwitchExplorer: function() {
      Accessibility.LoadExplorer();
    },
    LoadModule: function(option, module, signal, opt_startup) {
      var flag = Accessibility.GetOption(option);
      if (flag) {
        MathJax.Ajax.Require(module);
      }
      if (opt_startup) return flag;
      HUB.Register.StartupHook(signal, function() {
        HUB.Reprocess();
      });
      return flag;
    },
    LoadExplorer: function(opt_startup) {
      return Accessibility.LoadModule(
        'explorer', '[RespEq]/Assistive-Explore.js', 'Explorer Ready', opt_startup
      );
    },
    LoadCollapse: function(opt_startup) {
      return Accessibility.LoadModule(
        'collapse', '[RespEq]/Semantic-Collapse.js', 'Semantic Collapse Ready',
        opt_startup
      );
    },
    SwitchCollapse: function() {
      Accessibility.LoadCollapse();
    },
    Startup: function() {
      Accessibility.AddDefaults();
      Accessibility.Menu.Add();
      var explorer = Accessibility.LoadExplorer(true);
      var collapse = Accessibility.LoadCollapse(true);
      if (explorer || collapse) {
        HUB.Queue(['Reprocess', HUB]);
      }
    }
  };

  var A11YMENU = MathJax.Extension.Accessibility.Menu = {
    a11yBox: ITEM.CHECKBOX(['AccessibilityBox', 'Accessibility'],
                           'Accessibility-explorer',
                           {action: Accessibility.SwitchExplorer}),
    respBox: ITEM.CHECKBOX(['ResponsiveBox', 'Responsive Equations'],
                                 'Accessibility-collapse',
                           {action: Accessibility.SwitchCollapse}),
    Add: function() {
      // Attaches the menu;
      var about = MENU.IndexOfId('About');
      about === null ? 
        MENU.items.push(ITEM.RULE(), A11YMENU.respBox, A11YMENU.a11yBox) :
        MENU.items.splice(
          about, 0, A11YMENU.respBox, A11YMENU.a11yBox, ITEM.RULE());
    }
  };

})(MathJax.Hub);



MathJax.Callback.Queue(
  MathJax.Hub.Register.StartupHook('MathMenu Ready', function() {
    MathJax.Extension.Accessibility.Startup();
    MathJax.Hub.Startup.signal.Post('Accessibility Loader Ready');
  }));

MathJax.Ajax.loadComplete("[RespEq]/Accessibility-Extension.js");

