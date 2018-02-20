
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

var loop = (source, target, creatures) => {
    // console.log('Getting experiment', experiment)

    // Stringify the data
    creatures && creatures.forEach(c => {
        c.data = JSON.stringify(c.data)
    })

    // Send to server
    setTimeout(() => {
            post('ga.php', {
            source,
            target,
            creatures
        }, res => {

            // Parse creatures data
            res.creatures.forEach(c => {
                c.data = JSON.parse(c.data)
            })

            // Try new creatures
            new Universe(res)
        }, res => setTimeout(() => loop(experiment, creatures), 1000))
    }, 1000)
}

importScripts('worker.nevo.js')
Universe.loop()
