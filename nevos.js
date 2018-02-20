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
    w: 10000,
    h: 10000,
    tileSize: 400,
    default_meals: 700,
    default_nevos: 200,
}
Conf.meal = {
    energy: 200,
    timeout: 10,
    poison: 0,
}
Conf.nevo = {
    max_life: 5000,
    default_life: 400,
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
        console.log('Starting universe', data.creatures.length, 'DB [', data.source.size, data.target.size, ']')
        range(Conf.world.default_nevos, i => {
            var n
            if (!data.creatures.length) {
                n = new Nevo(world)
            } else {
                var a = Nevo.generate(pick(pick(data.creatures).data.nevos), world)
                var b = Nevo.generate(pick(pick(data.creatures).data.nevos), world)
                n = a.reproduce(b)
            }
            n.gen = { population: this.nevos }
            this.nevos.push(n)
        })

        world.setup(this.nevos)
        while (world.nevos.length > 0) {
            world.update()
        }

        // Sort and slice
        // NOTE
        // determines the number of nevos packed in this universe
        this.nevos.sort((a, b) => b.fitness()-a.fitness())
        this.nevos.splice(1)
        this.nevos.forEach((n, i) => {
            this.nevos[i] = n.pack()
        })

        // Loop!
        Universe.loop(this)
    }

    fitness() {
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
            console.log(universe.fitness())
        }
        var creatures = universe ? [{
            parent_id: 0,
            data: universe,
            fitness: universe.fitness()
        }] : null

        loop('nevo-killers', 'nevo-killers', creatures)
    }
}
