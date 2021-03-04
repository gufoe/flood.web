{
    importScripts('projects/nevo/utils/utils.js')
    importScripts('projects/nevo/utils/perlin.js')
    importScripts('projects/nevo/utils/angle.js')
    importScripts('projects/nevo/utils/vec.js')
    importScripts('projects/nevo/utils/distr.js')
    importScripts('projects/nevo/utils/seq.js')
    importScripts('projects/nevo/brain/brain.js')
}
importScripts('utils.js')



class Thing {
    constructor(thing) {
        this.parent_id = thing ? thing.id : null
        this.data = {}

        if (thing) {
            this.data.net = new Net(thing.data.net)
            this.data.net.mutate()
            // console.log(this.data.net)
        } else {
            this.data.net = new Net()
        }
    }

    xor() {
        var net = this.data.net
        this.fitness = 0
        var x = [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
        ]
        var y = [ 0, 1, 1, 0 ]
        var totalticks = 0
        var tests = 100
        for (var j = 0; j < tests; j++) {
            var i = j < 16 ? j%4 : randInt(4)
            // for (var i in x) {

                // console.log('=======================')
                net.set('x1', x[i][0])
                net.set('x2', x[i][1])
                // console.log(clone(net.nodes), net.nodes.x1.val, net.nodes.x2.val)
                var ticks = 0
                do {
                    net.tick()
                    ticks++
                    totalticks++
                } while (ticks < 5 && net.val('done') > 0)

                // console.log(clone(net.nodes))
                // console.log(clone(net.nodes))
                var out = net.val('y')
                // if (y[i] != out) break
                // console.log(x[i], out, y[i] == out)
                var diff = Math.min(1, Math.abs(y[i] - out))
                this.fitness-= diff
            // }
        }
        // console.log(this.fitness)
        if (this.fitness == NaN) {
            console.error('Porco dio c\'è un NaN')
        }

        if (this.fitness < -.01) {
            this.fitness = -999
        } else {
            this.fitness = - totalticks - net.complexity()/1000
        }
    }


    test(verbose) {
        // return this.xor()
        this.fitness = 0
        var net = this.data.net
        var sentences = {
            'say say' : 'say',
            'say hi' : 'hi',
            'say ok' : 'ok',
            'say no' : 'no',
            'say yes' : 'yes',
            'say friend' : 'friend',
            'say Jack' : 'Jack',
            'say is' : 'is',
            'say your' : 'your',
            'say name' : 'name',
            'Jack is your friend' : 'ok',
            'your name is Pinocchio': 'ok',
            'my name is Jack': 'ok',
            'what is my name ?': 'Jack',
            'what is your name ?': 'Pinocchio',
            'she is marla': 'hi',
            'what is she name ?': 'marla',
            'are you stupid ?' : 'no',
            'is jack stupid ?' : 'no',
            'we are friends' : 'yes',
            'we are real friends' : 'yes',
            'we are fake friends' : 'no',
            'do you like jack ?' : 'yes',
            'is jack your friend ?' : 'yes',
            'is jack your enemy ?' : 'no',
        }

        var tests = 100
        for (var j = 0; j < tests; j++) {
            var s = j < tests/2 ? keys(sentences)[j%len(sentences)] : pick(keys(sentences))
            var sentence = s.split(' ')
            var answer = sentences[s]

            // net.reset()
            sentence.forEach(word => {
                net.val(word)
                net.set(word, 1)
                net.tick()
                // net.set(word, 0)
            })

            for (var i = 0; i < 20 && net.val('done?') < 0; i++) {
                net.tick()
            }
            if (net.val('done?') > 0) {
                break
                this.fitness-= .5
                continue
            }
            var top = null
            for (var i in net.nodes) {
                var n = net.nodes[i]
                if (!n.output) continue
                if (top == null || n.val > top.val) {
                    top = n
                }
            }

            verbose && console.log(s, ' --- ', top.id)
            if (top.id == answer) {
                this.fitness++
            } else {
                break
                this.fitness--
            }
        }

        // this.fitness-= net.plasticity()/len(net.nodes)
    }
}

var verybest = null
var last_rounds = null
var last_best = null

class Universe {
    constructor(data) {
        // console.clear()
        console.info('From', data.source.name, '['+data.source.size+']',
                    ' to ', data.target.name, '['+data.target.size+']')
        console.info('My very best:', verybest ? verybest.fitness : null, verybest)
        console.info('Last best:   ', last_best ? last_best.fitness : null)
        console.info('Last rounds: ', last_rounds)
        var best = null
        // last_best && last_best.test(true)

        var start = millis()
        for (var i = 0; millis() - start < 1500; i++) {
            var thing = data.creatures[i%data.creatures.length]

            var t = new Thing(thing)
            t.test()
            if (!best || t.fitness > best.fitness) {
                if (!verybest || t.fitness > verybest.fitness) {
                    console.log('New best!', t.fitness)
                    verybest = t
                }
                best = t
            }
        }

        last_rounds = i
        last_best = best
        this.best = best

        Universe.loop(this)
    }

    fitness() {
        return this.best.fitness
    }

    static loop(uni) {
        Universe.source_experiment = 'null'
        Universe.target_experiment = 'talk100'

        var creatures = uni ? [{
            parent_id: 0,
            data: [clone(uni.best)],
            fitness: uni.fitness(),
        }] : null

        loop('talk100', 'talk100', creatures)
    }
}
