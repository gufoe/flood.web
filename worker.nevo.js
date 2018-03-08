{
    importScripts('projects/nevo/utils/utils.js')
    importScripts('projects/nevo/utils/perlin.js')
    importScripts('projects/nevo/utils/angle.js')
    importScripts('projects/nevo/utils/vec.js')
    importScripts('projects/nevo/utils/distr.js')
    importScripts('projects/nevo/utils/seq.js')
    importScripts('projects/nevo/world/meal.js')
    importScripts('projects/nevo/world/nevo.js')
    importScripts('projects/nevo/world/world.js')
    importScripts('projects/nevo/brain/brain.js')
}


var Conf = {}

// Init
Conf.world = {
    w: 5000,
    h: 10000,
    tileSize: 300,
    default_meals: 160,
    default_nevos: 120,
}
Conf.meal = {
    energy: 400,
    timeout: 500,
    poison: 0,
}
Conf.nevo = {
    max_life: 5000,
    default_life: 1000,
    viewRange: Math.PI / 1.7,
    viewAccuracy: 13,
    maxLinVel: 10,
    maxLinAcc: 1,
    maxAngVel: (Math.PI / 16.0),
    maxAngAcc: (Math.PI / 16.0) / 10,
    speed_bonus: 0,
    ticks_per_tought: 1,
}

class Universe {
    constructor (data) {
        var world = new World()
        this.nevos = []
        // console.log('Starting universe', data.creatures.length, 'DB [', data.source.size, data.target.size, ']')
        range(Conf.world.default_nevos, i => {
            var n
            if (!data.creatures.length) {
                n = new Nevo(world)
                // console.log('generated', n)
            } else {
                var a = Nevo.generate(pick(pick(data.creatures).data.nevos), world)
                var b = Nevo.generate(pick(pick(data.creatures).data.nevos), world)
                if (Math.random() > .5) {
                    n = a.reproduce(b)
                } else {
                    n = a
                }
                for (var i in n.brains)
                    n.brains[i].mutate()
                // console.log('reproduced', n)
            }
            n.gen = { population: this.nevos }
            this.nevos.push(n)
            // console.log('pushed', this.nevos.length)
        })
        // console.log('posting message')
        postMessage({
            cmd: 'setItem',
            args: [ 'lives', JSON.stringify(this.nevos.map(n => n.pack())) ],
        })
        world.setup(this.nevos)
        // console.log('starting world with nevos:', world.nevos.length)
        while (world.nevos.length > 0) {
            world.update()
        }
        // this.age = world.age
        // Sort and slice
        // NOTE
        // determines the number of nevos packed in this universe
        this.nevos.sort((a, b) => b.fitness()-a.fitness())
        // this.fit = this.nevos[0].fitness()+this.nevos[this.nevos.length-1].fitness()
        this.fit = -world.meals.length
        this.nevos.splice(10)
        this.fit = 0
        this.nevos.forEach((n, i) => {
            this.nevos[i] = n.pack()
            this.fit+= this.nevos[i].fitness
        })
        this.fit/= this.nevos.length
        this.nevos.splice(2)
        console.log('world ended, age:', world.age, this.fitness())

        // Loop!
        Universe.loop(this)
    }

    fitness() {
        return this.fit
        var c = this.nevos
        // Average fitnesses
        var avg = 0
        c.forEach(n => avg+= n.fitness)
        avg/= c.length

        return avg
        return this.nevos[0].fitness
    }

    static loop(universe) {
        if (universe) {
            // console.log('Universe fitnes was:', universe.fitness())
        }
        var creatures = universe ? [{
            parent_id: 0,
            data: universe,
            fitness: universe.fitness()
        }] : null

        loop('nevo-killers.0303.'+(5+Math.floor(Math.random()*3)), 'nevo-killers.0303.7', creatures)
    }
}
