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
  LoadModule: function(option, module, signal, opt_startup) {
    var flag = MathJax.Extension.Accessibility.GetOption(option);
    if (flag) {
      MathJax.Ajax.Require(module);
    }
    if (opt_startup) return flag;
    MathJax.Hub.Register.StartupHook(signal, function() {
      MathJax.Hub.Reprocess();
    });
    return flag;
  },
  LoadExplorer: function(opt_startup) {
    return MathJax.Extension.Accessibility.LoadModule(
      'explorer', '[RespEq]/Assistive-Explore.js', 'Explorer Ready', opt_startup
    );
  },
  SwitchExplorer: function() {
    MathJax.Extension.Accessibility.LoadExplorer();
  },
  LoadCollapse: function(opt_startup) {
    return MathJax.Extension.Accessibility.LoadModule(
      'collapse', '[RespEq]/Semantic-Collapse.js', 'Semantic Collapse Ready',
      opt_startup
    );
  },
  SwitchCollapse: function() {
    MathJax.Extension.Accessibility.LoadCollapse();
  },
  Startup: function() {
    MathJax.Extension.Accessibility.AddDefaults();
    MathJax.Extension.Accessibility.AddMenu();
    var explorer = MathJax.Extension.Accessibility.LoadExplorer(true);
    var collapse = MathJax.Extension.Accessibility.LoadCollapse(true);
    if (explorer || collapse) {
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

