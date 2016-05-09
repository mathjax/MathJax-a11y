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
        A11YMENU.Active(option, signal);
      }
      if (opt_startup) return flag;
      if (!flag) {
        A11YMENU.Remove(option);
      }
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
    a11yBox: ITEM.CHECKBOX(['Accessibility', 'Accessibility'],
                           'Accessibility-explorer',
                           {action: Accessibility.SwitchExplorer}),
    a11yActive: ITEM.CHECKBOX(['Active', 'Active'],
                           'Accessibility-explorer',
                           {action: Accessibility.SwitchExplorer}),
    respBox: ITEM.CHECKBOX(['Responsiveness', 'Responsiveness'],
                           'Accessibility-collapse',
                           {action: Accessibility.SwitchCollapse}),
    respActive: ITEM.CHECKBOX(['Active', 'Active'],
                               'Accessibility-collapse',
                           {action: Accessibility.SwitchCollapse}),
    Add: function() {
      // Attaches the menu;
      var about = MENU.IndexOfId('About');
      about === null ? 
        MENU.items.push(ITEM.RULE(), this.respBox, this.a11yBox) :
        MENU.items.splice(
          about, 0, this.respBox, this.a11yBox, ITEM.RULE());
    },
    Active: function(item, signal) {
      //TODO: Make sure it is not added twice!
      var activeMap = {'explorer': this.a11yActive,
                    'collapse': this.respActive};
      var menuMap = {'explorer': 'Accessibility',
                     'collapse': 'Responsiveness'};
      var active = activeMap[item];
      var menu = menuMap[item];
      if (!active || !menu) return;
      HUB.Register.StartupHook(signal, function() {
        var submenu = MENU.FindId(menu);
        if (submenu !== null) {
          submenu.submenu.items.push(ITEM.RULE(), active);
        }
      });
    },
    Remove: function(item) {
      var menuMap = {'explorer': 'Accessibility',
                     'collapse': 'Responsiveness'};
      var boxMap = {'explorer': this.a11yBox,
                    'collapse': this.respBox};
      var box = boxMap[item];
      var menu = menuMap[item];
      if (!box || !menu) return;
      var index = MENU.IndexOfId(menu);
      if (index !== null) {
        MENU.items[index] = box;
      }
    }
  };

})(MathJax.Hub);



MathJax.Callback.Queue(
  MathJax.Hub.Register.StartupHook('MathMenu Ready', function() {
    MathJax.Extension.Accessibility.Startup();
    MathJax.Hub.Startup.signal.Post('Accessibility Loader Ready');
  }));

MathJax.Ajax.loadComplete("[RespEq]/Accessibility-Extension.js");

