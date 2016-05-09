//
// Thin hook to include the accessibility extension.
//
MathJax.Callback.Queue(
  MathJax.Hub.Register.StartupHook('MathMenu Ready', function() {
  
  var SETTINGS = MathJax.Hub.config.menuSettings;

  var Accessibilty = MathJax.Extension.Accessibilty = {
    version: '1.0',
    default: {
      explorer: false,
      collapse: false
    },
    addDefaults: function() {
      var keys = Object.keys(Accessibilty.default);
      for (var i = 0, key; key = keys[i]; i++) {
        if (typeof(SETTINGS[Accessibilty.prefix + key]) === 'undefined') {
          SETTINGS['Accessibility-' + key] = Accessibilty.default[key];
        }
      }
    },
    Startup: function() {
      MathJax.Extension.Accessibilty.addDefaults();
    },
    LoadExplorer: function() {
      console.log('Dummy load explorer.');
    },
    LoadCollapse: function() {
      console.log('Dummy load collapse.');
    }
  };
    
    var ITEM = MathJax.Menu.ITEM;
    var accessibilityBox =
          ITEM.CHECKBOX(['Accessibility', 'Accessibility'],
                        'Accessibility-explorer',
                        {action: Accessibilty.LoadExplorer});
    var responsiveBox =
          ITEM.CHECKBOX(['ResponsiveEquations', 'Responsive Equations'],
                        'Accessibility-collapse',
                        {action: Accessibilty.LoadCollapse});

    // Attaches the menu;
    var about = MathJax.Menu.menu.IndexOfId('About');
    if (about === null) {
      MathJax.Menu.menu.items.push(
        ITEM.RULE(), responsiveBox, accessibilityBox);
      return;
    }
    MathJax.Menu.menu.items.splice(
      about, 0, responsiveBox, accessibilityBox, ITEM.RULE());
    
  MathJax.Hub.Startup.signal.Post('Accessibility Loader Ready');

  }));


MathJax.Ajax.loadComplete("[RespEq]/Accessibility-Extension.js");
