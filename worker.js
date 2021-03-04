if (typeof require !== 'undefined') {
  importScripts = require('./is').importScripts
  axios = require('axios')
  FormData = require('form-data')
  postMessage = () => {}
}

var post = (url, data, on_ok, on_err) => {
  if (!url || !url.match(/^https?:\/\//)) {
    url = 'http://localhost:8090/' + url
  }

  return axios.post(url, data).then(
    (res) => console.log(res.data) && on_ok(res.data),
    (err) => console.log(err.message) && on_err(err)
  )
}

let _data = null
var _update_pop = null
var loop = (source, target, creatures) => {
  // console.log('Getting experiment', experiment)
  if (creatures) {
    _data.creatures = JSON.parse(JSON.stringify(creatures))
    // Stringify the data
    creatures.forEach((c) => {
      c.data = JSON.stringify(c.data)
    })
    post(
      'record_and_get',
      {
        source,
        target,
        creatures,
      },
      (res) => {}
    )
    setTimeout(() => new Universe(_data))
  } else {
    let desc = [source, ['in1', 'in2'], ['y1', 'y2']]
    post('generate', { Get: [[10, desc]] }, (res) => {
      res[source].forEach((c) => {
        c.data = JSON.parse(c.data)
      })
      console.log(
        'off',
        res.creatures.map((c) => c.data.offset)
      )
      _data = res
      new Universe(_data)
    })
  }
  if (!_update_pop) {
    _update_pop = setInterval(() => updatePopulation(source, target), 10000)
  }
}

function updatePopulation(source, target) {
  console.log('updating...')
  post(
    'ga.php???',
    {
      source,
      target,
    },
    (res) => {
      res.creatures.forEach((c) => {
        c.data = JSON.parse(c.data)
      })
      _data = res
      console.log('updated the population')
    }
  )
}

importScripts('worker.nevo.js')
Universe.loop(null, loop)
