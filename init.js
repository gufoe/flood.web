var call = {
  setItem: ([a, b]) => localStorage.setItem(a, b),
}
var handler = (what) => {
  if (!what) return
  wat = what.data
  var res = wat.cmd
  // console.log('rec', res)
  try {
    var res = call[wat.cmd](wat.args)
  } catch(e) {
    console.log(e.message)
  }
  // console.log('res', res)
}

var w = new Worker('worker.js')
w.onmessage = handler

var w = new Worker('worker.js')
w.onmessage = handler
//
// var w = new Worker('worker.js')
// w.onmessage = handler
//
// var w = new Worker('worker.js')
// w.onmessage = handler


setTimeout(() => location.reload(), 60000)
