//
// Thin hook to include the accessibility extension.
//
(function(HUB,EXTENSIONS) {
  var SETTINGS = HUB.config.menuSettings;
  var ITEM, MENU; // filled in when MathMenu extension loads
  
  var BIND = (Function.prototype.bind ? function (f,t) {return f.bind(t)} :
              function (f,t) {return function () {f.apply(t,arguments)}});
  var KEYS = Object.keys || function (obj) {
    var keys = [];
    for (var id in obj) {if (obj.hasOwnProperty(id)) keys.push(id)}
    return keys;
  };

  var Accessibility = EXTENSIONS.Accessibility = {
    version: '1.0',
    prefix: '', //'Accessibility-',
    default: {},
    modules: [],
    MakeOption: function(name) {
      return Accessibility.prefix + name;
    },
    GetOption: function(option) {
      return SETTINGS[Accessibility.MakeOption(option)];
    },
    AddDefaults: function() {
      var keys = KEYS(Accessibility.default);
      for (var i = 0, key; key = keys[i]; i++) {
        var option = Accessibility.MakeOption(key);
        if (typeof(SETTINGS[option]) === 'undefined') {
          SETTINGS[option] = Accessibility.default[key];
        }
      }
    },
    // Attaches the menu items;
    AddMenu: function() {
      var items = Array(this.modules.length);
      for (var i = 0, module; module = this.modules[i]; i++) items[i] = module.placeHolder;
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
      ITEM = MathJax.Menu.ITEM;
      MENU = MathJax.Menu.menu;
      for (var i = 0, module; module = this.modules[i]; i++) {
        module.CreateMenu();
        module.AddMethods();
      }
      this.AddMenu();
    },
    LoadExtensions: function () {
      var extensions = [];
      for (var i = 0, mpdule; module = this.modules[i]; i++) {
        if (SETTINGS[module.option]) extensions.push(module.module);
      }
      return (extensions.length ? HUB.Startup.loadArray(extensions) : null);
    }
  };

  var ModuleLoader = MathJax.Extension.ModuleLoader = MathJax.Object.Subclass({
    option: '',
    name: '',
    module: '',
    placeHolder: null,
    submenu: false,
    extension: null,
    Enable: null,
    Disable: null,
    Init: function(option, name, module, extension, submenu) {
      this.option = option;
      this.name = [name.replace(/ /g,''),name];
      this.module = module;
      this.extension = extension;
      this.submenu = (submenu || false);
    },
    CreateMenu: function() {
      var load = BIND(this.Load,this);
      if (this.submenu) {
        this.placeHolder =
          ITEM.SUBMENU(this.name,
            ITEM.CHECKBOX(["Activate","Activate"],
                          Accessibility.MakeOption(this.option), {action: load}),
            ITEM.RULE(),
            ITEM.COMMAND(["OptionsWhenActive","(Options when Active)"],null,{disabled:true})
          );
      } else {
        this.placeHolder = ITEM.CHECKBOX(
          this.name, Accessibility.MakeOption(this.option), {action: load}
        );
      }
    },
    Load: function() {
      HUB.Queue(["Require",MathJax.Ajax,this.module,["AddMethods",this,true]]);
    },
    AddMethods: function(menu) {
      var ext = MathJax.Extension[this.extension];
      if (ext) {
        this.Enable = BIND(ext.Enable,ext);
        this.Disable = BIND(ext.Disable,ext);
        if (menu) {
          this.Enable(true,true);
          MathJax.Menu.saveCookie();
        }
      }
    }
  });

  HUB.Register.StartupHook('End Extensions', function () {
    HUB.Register.StartupHook('MathMenu Ready', function () {
      Accessibility.Startup();
      HUB.Startup.signal.Post('Accessibility Loader Ready');
    },5);   // run before other extensions' menu hooks even if they are loaded first
  },5);
  
  Accessibility.Register(
    ModuleLoader(
      'collapsible', 'Collapsible Math', '[RespEq]/Semantic-Complexity.js',
      'SemanticComplexity'
    )
  );
  Accessibility.Register(
    ModuleLoader(
      'autocollapse', 'Auto Collapse', '[RespEq]/Semantic-Collapse.js',
      'SemanticCollapse'
    )
  );
  Accessibility.Register(
    ModuleLoader(
      'explorer', 'Accessibility', '[RespEq]/Assistive-Explore.js',
      'Assistive', true
    )
  );

  Accessibility.AddDefaults();
  
  MathJax.Callback.Queue(
    ["LoadExtensions",Accessibility],
    ["loadComplete",MathJax.Ajax,"[RespEq]/Accessibility-Extension.js"]
  );

})(MathJax.Hub,MathJax.Extension);


