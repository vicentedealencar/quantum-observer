const casper = require('casper').create()
const cTable = require('console.table')

const user = casper.cli.options.QUANTUM_USER
const pass = casper.cli.options.QUANTUM_PASS
var historyHeader = null
var historyData = []
var lastBtcBrl = 0

casper.start()

casper.thenOpen('https://www.mercadobitcoin.net/api/BTC/ticker/', {
    method: 'get',
    headers: {
        'Accept': 'application/json'
    }
}, function () {
    const content = JSON.parse(this.getPageContent())
    lastBtcBrl = content.ticker.last
    console.log('BTC: ', toMoney(content.ticker.last))
})

casper.thenOpen('https://quantum.atlasproj.com/br/login/', function () {
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

casper.waitWhileSelector('.login-form', function() {
    this.echo(this.getTitle())
})

const paginate = function (page) {
    casper.thenOpen('https://quantum.atlasproj.com/history.php?page=' + page, function() {
        this.echo(this.getTitle() + ' - ' + page)
        hasRows = this.exists('table tbody tr')
        if (!hasRows) {
            this.echo('NO MORE HISTORY', 'INFO')
        } else {
            historyHeader = this.evaluate(fetchHistoryPageHeader)
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

const fetchHistoryPageHeader = function () {
    const tr =  document.querySelectorAll('table thead tr')[0]
    const arr = []
    for (var i = 0; i < tr.children.length; i++) {
        const td = tr.children[i]
        arr.push(td.innerText)
    }
    return arr
}

const toMoney = function (value) {
    return 'R$' + parseFloat(value).toFixed(2)
}

const toPercent = function (value) {
    return parseFloat(value).toFixed(2) + '%'
}

casper.run(function() {
    const count = historyData.length
    const dateStart = historyData[historyData.length - 1][0]
    const valueStart = historyData[historyData.length - 1][3]
    const dateEnd = historyData[0][0]
    const valueEnd = historyData[0][4]
    const diff = valueEnd - valueStart
    const profit = toPercent(100 * diff / valueStart)
    const PvInitial = lastBtcBrl * valueStart
    const PvEnd = lastBtcBrl * valueEnd
    const PvDiff = PvEnd - PvInitial
    const PvProfit = toPercent(100 * diff / valueStart)

    const report = {
        count: count,
        dateStart: dateStart,
        valueStart: valueStart,
        dateEnd: dateEnd,
        valueEnd: valueEnd,
        diff: diff,
        profit: profit,
    }
    
    const presentValue = {
        BTC: toMoney(lastBtcBrl),
        initial: toMoney(PvInitial),
        end: toMoney(PvEnd),
        diff: toMoney(PvDiff),
        profit: toPercent(PvProfit)
    }

    console.table(historyHeader, historyData)
    console.table('Total', [report])
    console.table('Present Value', [presentValue])
    
    this.echo('THE END', 'INFO').exit()
})
