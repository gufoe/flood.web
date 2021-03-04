if (typeof require !== 'undefined') {
  importScripts = require('./is').importScripts
  fetch = require('node-fetch')
  FormData = require('form-data')
  postMessage = () => {}
}

var post = (url, data, ok, err) => {
  function objectToFormData(obj, form, namespace) {
    let fd = form || new FormData()
    let formKey

    for (let property in obj) {
      if (obj.hasOwnProperty(property) && obj[property] != undefined) {
        if (namespace) {
          formKey = namespace + '[' + property + ']'
        } else {
          formKey = property
        }

        // if the property is an object, but not a File, use recursivity.
        if (obj[property] instanceof Date) {
          fd.append(formKey, obj[property].toISOString())
        } else if (typeof obj[property] === 'object') {
          objectToFormData(obj[property], fd, formKey)
        } else {
          // if it's a string or a File object
          fd.append(formKey, obj[property])
        }
      }
    }

    return fd
  }

  if (!url || !url.match(/^https?:\/\//)) {
    url = 'https://demo.gufoe.it/ai/public/flood.web/' + url
  }

  return fetch(url, {
    method: 'POST',
    body: objectToFormData(data),
  }).then((res) => res.json().then(ok), err)
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
      'ga.php',
      {
        source,
        target,
        creatures,
      },
      (res) => {}
    )
    setTimeout(() => new Universe(_data))
  } else {
    post('ga.php', { source, target }, (res) => {
      res.creatures.forEach((c) => {
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
