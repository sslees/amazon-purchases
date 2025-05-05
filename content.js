const ORDER_ID_SEL = '.order-header [class$="order-id"]';

async function fetchTxnDetails(orderId) {
    const url = `https://www.amazon.com/gp/css/summary/print.html?orderID=${orderId}`;
    const response = await fetch(url, { credentials: 'include' });

    if (!response.ok) return;

    const text = new DOMParser().parseFromString(await response.text(), 'text/html').body.innerText;

    return [...text.matchAll(/(\w+) ending in (\d{4}):\s*(\w+ \d{1,2}, \d{4}):\s*(\$\d+\.\d{2})/g)];
}

async function addTxnDetails() {
    document.querySelectorAll(ORDER_ID_SEL).forEach(async order => {
        const orderNumberMatch = order.innerText.match(/# (\d+(?:-\d+)*)/);

        if (order.querySelector('.txn-info') || !orderNumberMatch) return;
        (await fetchTxnDetails(orderNumberMatch[1])).forEach(txn => {
            const txnDiv = document.createElement('div');

            order.appendChild(txnDiv);
            txnDiv.className = 'txn-info';
            txnDiv.textContent = `${txn[4]} on ${txn[3]} (${txn[1]} *${txn[2]})`; // type, number, date, amount
        });
    });
}

addTxnDetails();
new MutationObserver(mutations => {
    if (mutations.some(mutation =>
        [...mutation.addedNodes].some(node =>
            node.nodeType === Node.ELEMENT_NODE && node.matches(ORDER_ID_SEL) && !node.querySelector('.txn-info')
        )
    )) addTxnDetails();
}).observe(document.body, { childList: true, subtree: true });
