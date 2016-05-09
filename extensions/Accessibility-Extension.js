//
// Thin hook to include the accessibility extension.
//
MathJax.Extension.Accessibility = {
  version: '1.0',
  default: {
    explorer: false,
    collapse: false
  },
  AddDefaults: function() {
    var settings = MathJax.Hub.config.menuSettings;
    var keys = Object.keys(MathJax.Extension.Accessibility.default);
    for (var i = 0, key; key = keys[i]; i++) {
      if (typeof(settings['Accessibility-' + key]) === 'undefined') {
        settings['Accessibility-' + key] =
          MathJax.Extension.Accessibility.default[key];
      }
    }
  },
  GetOption: function(option) {
    return MathJax.Hub.config.menuSettings['Accessibility-' + option];
  },
  AddMenu: function() {
    var ITEM = MathJax.Menu.ITEM;
    var accessibilityBox =
          ITEM.CHECKBOX(['Accessibility', 'Accessibility'],
                        'Accessibility-explorer',
                        {action: MathJax.Extension.Accessibility.SwitchExplorer});
    var responsiveBox =
          ITEM.CHECKBOX(['ResponsiveEquations', 'Responsive Equations'],
                        'Accessibility-collapse',
                        {action: MathJax.Extension.Accessibility.SwitchCollapse});

    // Attaches the menu;
    var about = MathJax.Menu.menu.IndexOfId('About');
    if (about === null) {
      MathJax.Menu.menu.items.push(
        ITEM.RULE(), responsiveBox, accessibilityBox);
      return;
    }
    MathJax.Menu.menu.items.splice(
      about, 0, responsiveBox, accessibilityBox, ITEM.RULE());
    
  },
  SwitchExplorer: function() {
    var explorer = MathJax.Extension.Accessibility.GetOption('explorer');
    if (explorer) {
      MathJax.Extension.Accessibility.LoadExplorer();
    }
    MathJax.Hub.Register.StartupHook('Explorer Ready', function() {
      MathJax.Hub.Reprocess();
    });
  },
  LoadExplorer: function() {
    MathJax.Ajax.Require("[RespEq]/Assistive-Explore.js");
  },
  SwitchCollapse: function() {
    var collapse = MathJax.Extension.Accessibility.GetOption('collapse');
    if (collapse) {
      MathJax.Extension.Accessibility.LoadCollapse();
    }
    MathJax.Hub.Register.StartupHook('Semantic Collapse Ready', function() {
      MathJax.Hub.Reprocess();
    });
  },
  LoadCollapse: function() {
    MathJax.Ajax.Require("[RespEq]/Semantic-Collapse.js");
  },
  Startup: function() {
    MathJax.Extension.Accessibility.AddDefaults();
    MathJax.Extension.Accessibility.AddMenu();
    var explorer = MathJax.Extension.Accessibility.GetOption('explorer');
    var collapse = MathJax.Extension.Accessibility.GetOption('collapse');
    if (explorer) {
      MathJax.Extension.Accessibility.LoadExplorer();
    }
    if (collapse) {
      MathJax.Extension.Accessibility.LoadCollapse();
    }
    if (collapse || explorer) {
      MathJax.Hub.Queue(['Reprocess', MathJax.Hub]);
    }
  }
};


MathJax.Callback.Queue(
  MathJax.Hub.Register.StartupHook('MathMenu Ready', function() {
    MathJax.Extension.Accessibility.Startup();
    MathJax.Hub.Startup.signal.Post('Accessibility Loader Ready');
  }));

MathJax.Ajax.loadComplete("[RespEq]/Accessibility-Extension.js");

