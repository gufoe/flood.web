(this.module || {}).exports = class Grafo {
    constructor(data) {
        this.data = data || {}
    }

    push(field, node, returnNode) {
        node = Grafo.make(node)
        this.data[field] = this.data[field] || []
        this.data[field].push(node)
        return returnNode ? node : this
    }

    link(field, node, returnNode) {
        node = Grafo.make(node)
        this.data[field] = node
        return returnNode ? node : this
    }

    set(field, value) {
        this.data[field] = value
        return this
    }

    get(field, def) {
        if (!this.data[field] && def) {
            this.data[field] = def
        }
        return this.data[field]
    }

    static make(node) {
        if (node && node.constructor && node.constructor.name == 'Grafo')
            return node
        else
            return new Grafo(node)
    }

    static test() {
        console.log('-------------')
        console.log('Starting test...')
        var db = new Grafo()


        var product = new Grafo({
            name: 'bread'
        })
        db.push('vetrina', product)

        var order = new Grafo({
            date: 'today',
            total: 43.99
        })
        order.push('products', product)
        product.push('orders', order)
        db.push('orders', order)



        console.log('-------------')
        console.log('Things in vetrina:')
        db.get('vetrina').forEach(product => console.log(product.get('name')))

        console.log('-------------')
        console.log('Orders:')
        db.get('orders').forEach(order => {
            console.log('-', order.get('date') + ':')
            order.get('products').forEach(product => console.log('  -',product.get('name')))
        })
        console.log('-------------')
    }
}
