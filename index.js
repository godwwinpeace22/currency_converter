// create database
let dbPromise = idb.open('testdb', 1, upgradeDb=>{
    switch(upgradeDb.oldVersion){
        case 0:
        upgradeDb.createObjectStore('keyval');
        case 1:
        upgradeDb.createObjectStore('currencies');
    }
})

// add service worker
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/app.js').then(reg=>{
        console.log(`registration successful, scope: ${reg.scope}`)
    }).catch(err=>{
        console.log(`an error occured  ${err}`)
    })
}


let baseUrl = `https://free.currencyconverterapi.com`;
let resultElem = document.getElementById('result');
let inputElem = document.getElementById('input');
let fromElem = document.getElementById('from')
let toElem = document.getElementById('to');

$(function(){
    //populate the options or make ajax request to get all currencies on load
    dbPromise.then(db => {
        let tx = db.transaction('currencies');
        let currencies = tx.objectStore('currencies')
        return currencies.get('currencies')
    }).then(curr => {
        if(curr == null || curr == undefined || curr == ''){
            // not yet stored ? Fetch from network
            $.ajax({
                url: `${baseUrl}/api/v5/currencies`,
                method:'GET',
                dataType: 'jsonp',
                success: function(data) {
                  
                  dbPromise.then(db=>{
                    let tx = db.transaction('currencies', 'readwrite');
                    let keyValStore = tx.objectStore('currencies');
                    keyValStore.put(data.results, 'currencies')
                    return tx.complete
                    }).then(_=>{
                        console.log('added all new currencies')
                        // display the data
                        
                    })
                    // append the currencies to the select elements
                    Object.keys(data.results).forEach((id,index)=>{
                        let option1 = document.createElement('option');
                        let option2 = document.createElement('option');
                        
                        option1.appendChild(document.createTextNode(id));
                        option1.setAttribute('value', id);

                        option2.appendChild(document.createTextNode(id));
                        option2.setAttribute('value', id);
                        
                        fromElem.appendChild(option1);
                        toElem.appendChild(option2);
                    }) 
                }
            });

        }
        else{
            // already saved ?
            // append the currencies to the select elements
            Object.keys(curr).forEach((id,index)=>{
                let option1 = document.createElement('option');
                let option2 = document.createElement('option');
                
                option1.appendChild(document.createTextNode(id));
                option1.setAttribute('value', id);

                option2.appendChild(document.createTextNode(id));
                option2.setAttribute('value', id);

                fromElem.appendChild(option1);
                toElem.appendChild(option2);
            })
        }
    });

})

async function convert(from,to){
    // get data from database. if not available, search online and then store it
    let query = `${from}_${to}`
    dbPromise.then(db=>{
        let tx = db.transaction('keyval');
        let keyValStore = tx.objectStore('keyval')
        
        return keyValStore.get(query)
    }).then(val=>{
        if(val == undefined){ 
            $.ajax({
                url: `${baseUrl}/api/v5/convert?q=${query}&compact=ultra`,
                method:'GET',
                dataType: 'jsonp',
                success: function(data) {
                    // save this data to indexDb store
                  dbPromise.then(db=>{
                    let tx = db.transaction('keyval', 'readwrite');
                    let keyValStore = tx.objectStore('keyval');
                    keyValStore.put(Object.values(data)[0], query)
                    return tx.complete
                    }).then(_=>{
                        resultElem.innerHTML = `result: ${Object.values(data)[0]  * inputElem.value}`
                    })
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) { 
                    return errorThrown
                }
            });
        }
        else{
            // the value is already in the database, so use it
            resultElem.innerHTML = `Result: ${val * inputElem.value}`
        }
    })
}

// click button to convert curr
document.getElementsByTagName('button')[0]
.addEventListener('click', async (e)=>{
    e.preventDefault()
    let from = fromElem.value
    let to = toElem.value
    await convert(from,to)
})


