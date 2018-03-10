const casper = require('casper').create()

const user = casper.cli.options.QUANTUM_USER
const pass = casper.cli.options.QUANTUM_PASS

casper.start('https://quantum.atlasproj.com/br/login/', function () {
    this.echo(this.getTitle())
})

casper.then(function () {
    if(!user || !pass) this.echo('NO USER OR PASS \nUsage: npm start -- --QUANTUM_USER=user --QUANTUM_PASS=pass', 'ERROR').exit()

    this.fillLabels('.login-form', 
    { 
        'Número de usuário': user, 
        'Senha': pass
    }, true)
})

casper.then(function () {
    this.reload()
})

casper.then(function () {
    this.echo(this.getTitle())
})

const trSelector = 'table tbody tr'
var historyData = []
const paginate = function (page) {
    casper.thenOpen('https://quantum.atlasproj.com/history.php?page=' + page, function() {
        this.echo(this.getTitle() + '-' + page)
        hasRows = this.exists(trSelector)
        if (!hasRows) {
            this.echo('NO MORE HISTORY', 'INFO')
        } else {
            const infos = this.evaluate(fetchHistoryPageData)
            historyData = historyData.concat(infos)
            paginate(page + 1)
        }
    })
}
paginate(1)

const fetchHistoryPageData = function() {
    const trs =  document.querySelectorAll('table tbody tr')
    
    const arrarr = []
    for (var i in trs) {
        if(parseInt(i) !== 0 && !parseInt(i)) continue

        const tr = trs[i]

        const arr = []
        for (var j in tr.children) {
            if(parseInt(j) !== 0 && !parseInt(j)) continue
            
            const td = tr.children[j]
            arr.push(td.innerText)
        }

        arrarr.push(arr)
    }

    return arrarr
}



casper.run(function() {
    const count = historyData.length
    const dateStart = historyData[historyData.length - 1][0]
    const valueStart = historyData[historyData.length - 1][3]
    const dateEnd = historyData[0][0]
    const valueEnd = historyData[0][4]
    const diff = valueEnd - valueStart
    const profit = diff / valueStart

    const report = {
        count: count,
        dateStart: dateStart,
        valueStart: valueStart,
        dateEnd: dateEnd,
        valueEnd: valueEnd,
        diff: diff,
        profit: profit,
    }

    console.log(JSON.stringify(report, null, 2))
    
    this.echo('FIM').exit()
})