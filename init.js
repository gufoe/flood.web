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
return
var w1 = new Worker('worker.js')
w1.onmessage = handler
var w2 = new Worker('worker.js')
w2.onmessage = handler
//
// var w = new Worker('worker.js')
// w.onmessage = handler
//
// var w = new Worker('worker.js')
// w.onmessage = handler


setTimeout(() => {
    w1.terminate()
    w2.terminate()
    location.reload()
}, 60000)
