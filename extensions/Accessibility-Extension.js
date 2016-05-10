//
// Thin hook to include the accessibility extension.
//
(function(HUB) {
  var SETTINGS = HUB.config.menuSettings;
  var ITEM = MathJax.Menu.ITEM;
  var MENU = MathJax.Menu.menu;

  var Accessibility = MathJax.Extension.Accessibility = {
    version: '1.0',
    prefix: 'Accessibility',
    default: {},
    modules: [],
    MakeOption: function(name) {
      return Accessibility.prefix + '-' + name;
    },
    GetOption: function(option) {
      return SETTINGS[Accessibility.MakeOption(option)];
    },
    AddDefaults: function() {
      var keys = Object.keys(Accessibility.default);
      for (var i = 0, key; key = keys[i]; i++) {
        var option = Accessibility.MakeOption(key);
        if (typeof(SETTINGS[option]) === 'undefined') {
          SETTINGS[option] = Accessibility.default[key];
        }
      }
    },
    // Attaches the menu items;
    AddMenu: function() {
      var items = Accessibility.modules.map(function(x) {return x.placeHolder;});
      var about = MENU.IndexOfId('About');
      if (about === null) {
        items.unshift(ITEM.RULE());
        MENU.items.push.apply(MENU.items, items);
      } else {
        items.push(ITEM.RULE());
        items.unshift(about, 0);
        MENU.items.splice.apply(MENU.items, items);
      }
    },
    Register: function(module) {
      Accessibility.default[module.option] = false;
      Accessibility.modules.push(module);
    },
    Startup: function() {
      Accessibility.AddDefaults();
      Accessibility.AddMenu();
      var result = Accessibility.modules.map(function(x) {return x.Load();});
      if (result.reduce(function(x, y) {return x || y;}, false)) {
        HUB.Queue(['Reprocess', HUB]);
      }
    }
  };


  var ModuleLoader = MathJax.Extension.ModuleLoader = MathJax.Object.Subclass({
    option: '',
    name: '',
    module: '',
    signal: '',
    placeHolder: null,
    activeBox: null,
    subMenu: null,
    Init: function(option, name, module, signal) {
      this.option = option;
      this.name = name;
      this.module = module;
      this.signal = signal;
      var that = this;
      var helper = function() {that.Switch.apply(that);};
      this.placeHolder = ITEM.CHECKBOX(
        this.name, Accessibility.MakeOption(this.option), {action: helper});
      this.activeBox = ITEM.CHECKBOX(
        'Active', Accessibility.MakeOption(this.option), {action: helper});
    },
    Load: function() {
      var flag = Accessibility.GetOption(this.option);
      if (flag) {
        if (this.subMenu) {
          this.AddSubMenu();
        } else {
          MathJax.Ajax.Require(this.module);
          this.AddActiveBox();
        }
      }
      return flag;
    },
    Switch: function() {
      var flag = this.Load();
      if (!flag) {
        this.AddPlaceHolder();
      }
      HUB.Register.StartupHook(this.signal, function() {
        HUB.Reprocess();
      });
    },
    AddActiveBox: function() {
      var that = this;
      HUB.Register.StartupHook(this.signal, function() {
        if (that.subMenu) return;
        var submenu = MENU.FindId(that.name);
        if (submenu !== null) {
          submenu.submenu.items.push(ITEM.RULE(), that.activeBox);
        }
      });
    },
    AddPlaceHolder: function() {
      var index = MENU.IndexOfId(this.name);
      if (index !== null) {
        this.subMenu = MENU.items[index];
        MENU.items[index] = this.placeHolder;
      }
    },
    AddSubMenu: function() {
      var index = MENU.IndexOfId(this.name);
      if (index !== null) {
        MENU.items[index] = this.subMenu;
      }
    }
  },{});

})(MathJax.Hub);



MathJax.Callback.Queue(
  MathJax.Hub.Register.StartupHook('MathMenu Ready', function() {
  MathJax.Extension.Accessibility.Register(
    MathJax.Extension.ModuleLoader(
      'collapse', 'Responsiveness', '[RespEq]/Semantic-Collapse.js',
      'Semantic Collapse Ready'));
  MathJax.Extension.Accessibility.Register(
    MathJax.Extension.ModuleLoader(
      'explorer', 'Accessibility', '[RespEq]/Assistive-Explore.js',
      'Explorer Ready'));
    MathJax.Extension.Accessibility.Startup();
  MathJax.Hub.Startup.signal.Post('Accessibility Loader Ready');
}));

MathJax.Ajax.loadComplete("[RespEq]/Accessibility-Extension.js");

