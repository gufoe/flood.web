
var post = (url, data, ok, err) => {
    function objectToFormData(obj, form, namespace) {
        let fd = form || new FormData();
        let formKey;

        for (let property in obj) {
            if (obj.hasOwnProperty(property) && obj[property] != undefined) {
                if (namespace) {
                    formKey = namespace + '[' + property + ']';
                } else {
                    formKey = property;
                }

                // if the property is an object, but not a File, use recursivity.
                if (obj[property] instanceof Date) {
                    fd.append(formKey, obj[property].toISOString());
                } else if (typeof obj[property] === 'object' && !(obj[property] instanceof File)) {
                    objectToFormData(obj[property], fd, formKey);
                } else { // if it's a string or a File object
                    fd.append(formKey, obj[property]);
                }
            }
        }

        return fd;
    }

    return fetch(url, {
        method: "POST",
        body: objectToFormData(data),
    }).then(res => res.json().then(ok), err)
}

let _data = null
var loop = (source, target, creatures) => {
    // console.log('Getting experiment', experiment)
    if (creatures) {
        _data.creatures = JSON.parse(JSON.stringify(creatures))
        // Stringify the data
        creatures.forEach(c => {
            c.data = JSON.stringify(c.data)
        })
        post('ga.php', {
            source,
            target,
            creatures
        })
        setTimeout(() => new Universe(_data))

    } else {
        post('ga.php', {
            source,
            target,
        }, res => {
            res.creatures.forEach(c => {
                c.data = JSON.parse(c.data)
            })
            _data = res
            setTimeout(() => updatePopulation(source, target), 5000)
            new Universe(_data)
        })
    }
}

function updatePopulation(source, target) {
    console.log('updating...')
    post('ga.php???', {
        source,
        target,
    }, res => {
        res.creatures.forEach(c => {
            c.data = JSON.parse(c.data)
        })
        _data = res
        console.log('updated the population')
        setTimeout(() => updatePopulation(source, target), 5000)
    })
}


importScripts('worker.nevo.js')
Universe.loop()
