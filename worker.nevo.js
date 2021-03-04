if (typeof require !== 'undefined') {
  importScripts = require( './is').importScripts
}

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



Conf.world = {
    w: 4000,
    h: 3000,
    tileSize: 400,
    default_meals: 200,
    default_nevos: 100,
}
Conf.meal = {
    energy: 30,
    timeout: 80000,
    poison: .02,
}
Conf.nevo = {
    max_life: 4000,
    default_life: 150,
    viewRange: Math.PI / 1.7,
    viewAccuracy: 20,
    maxLinVel: 13,
    maxLinAcc: 1,
    maxAngVel: (Math.PI / 10.0),
    maxAngAcc: (Math.PI / 10.0) / 20,
    speed_bonus: 0,
    ticks_per_tought: 1,
}

class Universe {
    constructor (data) {
	data.creatures = data.creatures.filter(e => e)
        this.train(data)

        // console.log('posting message')
        postMessage({
            cmd: 'setItem',
            args: [ 'lives', JSON.stringify(this.nevos) ],
        })

        // Loop!
        Universe.loop(this)
    }

    generateNevos(world, data, count) {
        var nevos = []
        // console.log('Starting universe', data.creatures.length, 'DB [', data.source.size, data.target.size, ']')
        range(count, i => {
            var n
            if (!data.creatures.length) {
                n = new Nevo(world)
                // console.log('generated', n)
            } else {
                var a = Nevo.generate(pick(pick(data.creatures).data.nevos), world)
                var b = Nevo.generate(pick(pick(data.creatures).data.nevos), world)
                if (Math.random() > .01) {
                    n = a.reproduce(b)
                } else {
                    n = a
                    for (var i in n.brains) n.brains[i].mutate()
                }
                // console.log('reproduced', n)
            }
            n.gen = { population: nevos }
            nevos.push(n)
            // console.log('pushed', this.nevos.length)
        })

        return nevos
    }


    trainFromSingle(parent, iterations, keep, samesame, average) {
        var nevos = []
        parent.gen = { population: [] }
        var sum = 0
        range(iterations, () => {
            var world = new World({
                seed: 0
            })

            var nevo = parent.reproduce()
            if (samesame) parent = nevo

            world.setup([nevo])
            nevos.push(nevo)

            while (world.nevos.length > 0 && world.meals.length > 0) {
                world.update()
            }

            nevo.fit = nevo.age// < 6 ? -3000 : -world.age // same as nevo.age
            // nevo.fit-= nevo.brains.main.active.length/1000
            sum+= nevo.fitness()
        })


        nevos.sort((a, b) => b.fitness()-a.fitness())
        nevos.splice(keep)
        if (average) nevos.forEach(n => n.fit = sum/iterations)
        return nevos
    }


    trainBasic(world, num_callback) {
        // console.log('starting world with nevos:', world.nevos.length)

        while (world.nevos.length > 0) {
            world.update()
        }

        this.nevos.sort((a, b) => b.fitness()-a.fitness())
        this.nevos.splice(Math.floor(num_callback(this.nevos.length)))

        console.log('world ended, age:', world.age, 'fitness:', this.fitness())

    }

    trainFastest(world, min_fitness) {
        // console.log('starting world with nevos:', world.nevos.length)

        while (world.nevos.length > 0 && world.bestFitness < min_fitness) {
            world.update()
        }

        this.nevos.sort((a, b) => b.fitness()-a.fitness())
        this.fit = world.bestFitness < min_fitness ? 0 : -world.age

        this.nevos.splice(1)

        console.log('world ended, age:', world.age, 'fitness:', this.fitness())

    }

    fitness() {
        if (this.fit !== undefined) return this.fit

        var c = this.nevos
        // Average fitnesses
        var avg = 0
        c.forEach(n => avg+= (typeof n.fitness == 'function' ? n.fitness() : n.fitness))
        avg/= c.length
        return avg
    }

    evolveIndividually(nevos, times, samesame, average) {
        return nevos.map(n => {
            return this.trainFromSingle(n, times, 1, samesame, average)[0]
        }).sort((a, b) => b.fitness()-a.fitness())
    }

    train(data) {
        // this.trainFastest(world, 800)

        // Evolve each nevo to be the fastest
        this.nevos = []
        range(100, () => {
          var world = new World()
          var n = !data.creatures.length ? new Nevo(world) : Nevo.generate(pick(pick(data.creatures).data.nevos), world)
          world.setup([n])
          var target = 5
          // console.log('Running...')
          while (world.nevos.length && n.eaten < target) {
            world.update()
          }
          // console.log(n.eaten)
          if (n.eaten == target) {
            n.fit = - n.age
            this.nevos.push(n)
          }
        })
        if (!this.nevos.length) {
          this.fit = 0
          return
        }
        this.nevos = this.nevos.sort((a, b) => b.fitness()-a.fitness())
        console.log('Best', this.nevos[0].fitness())
        this.nevos.splice(1)


        // Evolve each nevo individually
        // var world = new World()
        // this.nevos = []
        // range(30, () => {
        //     this.nevos.push(!data.creatures.length ? new Nevo(world) : Nevo.generate(pick(pick(data.creatures).data.nevos), world))
        // })
        // this.nevos = this.evolveIndividually(this.nevos, 3, false, false)
        // this.nevos = [
        //     this.nevos[0]
        // ]
        // // this.nevos.splice(1)
        // console.log('Individual best', this.fitness(), this.nevos)

        //
        // var world = new World()
        // var tests = []
        // range(10, () => {
        //     if (data.creatures.length) {
        //         this.nevos = this.trainFromSingle(Nevo.generate(pick(pick(data.creatures).data.nevos), world), 10, 1, false)
        //     } else {
        //         this.nevos = this.trainFromSingle(new Nevo(world), 10, 1, false)
        //     }
        //
        //     // console.log('Individual best', this.fitness())
        //     tests.push({
        //         nevos: this.nevos,
        //         fitness: this.fitness()
        //     })
        // })
        //
        // tests = tests.sort((a, b) => b.fitness-a.fitness)
        // this.nevos = tests[0].nevos
        // console.log('Global best', this.fitness())



        // Basic training
        // var world = new World()
        // this.nevos = this.generateNevos(world, data, Conf.world.default_nevos)
        // world.setup(this.nevos)
        // this.trainBasic(world, n => 1)

        // var world = new World()
        // this.nevos = this.nevos.map(n => {
        //     return Nevo.generate(n, world)
        // })
        // world.setup(this.nevos)
        // this.trainBasic(world, n => 1)


        this.nevos = this.nevos.map(n => n.pack())
    }


    static loop(universe, on_finish) {
        var creatures = universe && universe.fitness() ? [{
            parent_id: 0,
            data: universe,
            fitness: universe.fitness(),
        }] : null

        let r = (min, max) => min+Math.floor(Math.random()*(max+1-min))

        Universe.fam_origin = 0 // Universe.fam_origin || r(0, 2)
        Universe.fam_target = Universe.fam_target || Universe.fam_origin
        // Universe.fam_target = r(0, 2)

        // if (r(0, 100) == 0) Universe.fam_target+= r(-1, 1)
        on_finish('fz0', 'fz0', creatures)
    }

}
