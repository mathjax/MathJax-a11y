//
//  Patch MathJax processInput() to perform the postInputHooks
//  (this is part of the semantic-enhance branch, but this file
//   allows you to use the CDN and patch it rather than run from
//   the semantic-enhance branch.)
//
MathJax.Hub.postInputHooks = MathJax.Callback.Hooks(true);
MathJax.Hub.processInput = function (state) {
  var jax, STATE = MathJax.ElementJax.STATE;
  var script, prev, m = state.scripts.length;
  try {
    //
    //  Loop through the scripts
    //
    while (state.i < m) {
      script = state.scripts[state.i]; if (!script) {state.i++; continue}
      //
      //  Remove previous error marker, if any
      //
      prev = script.previousSibling;
      if (prev && prev.className === "MathJax_Error") {prev.parentNode.removeChild(prev)}
      //
      //  Check if already processed or needs processing
      //
      if (!script.MathJax || script.MathJax.state === STATE.PROCESSED) {state.i++; continue};
      if (!script.MathJax.elementJax || script.MathJax.state === STATE.UPDATE) {
        this.checkScriptSiblings(script);                 // remove preJax/postJax etc.
        var type = script.type.replace(/ *;(.|\s)*/,"");  // the input jax type
        var input = this.inputJax[type];                  // the input jax itself
        jax = input.Process(script,state);                // run the input jax
        if (typeof jax === 'function') {                  // if a callback was returned
          if (jax.called) continue;                       //   go back and call Process() again
          this.RestartAfter(jax);                         //   wait for the callback
        }
        jax = jax.Attach(script,input.id);                // register the jax on the script
        this.saveScript(jax,state,script,STATE);          // add script to state
        this.postInputHooks.Execute(jax,input.id,script); // run global jax filters
      } else if (script.MathJax.state === STATE.OUTPUT) {
        this.saveScript(script.MathJax.elementJax,state,script,STATE); // add script to state
      }
      //
      //  Go on to the next script, and check if we need to update the processing message
      //
      state.i++; var now = new Date().getTime();
      if (now - state.start > this.processUpdateTime && state.i < state.scripts.length)
        {state.start = now; this.RestartAfter(MathJax.Callback.Delay(1))}
    }
  } catch (err) {return this.processError(err,state,"Input")}
  //
  //  Put up final message, reset the state and return
  //
  if (state.scripts.length && this.config.showProcessingMessages)
    MathJax.Message.Set(["ProcessMath","Processing math: %1%%",100],0);
  state.start = new Date().getTime(); state.i = state.j = 0;
  return null;
};

