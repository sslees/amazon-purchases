const ORDER_ID_SEL = '.order-header [class$="order-id"]';
const REFUND_REGEX = /(\w+\s+\d{1,2},\s+\d{4})(?:.|\s)*(\$\d+\.\d{2})/;
const PAYMENT_REGEX = /(\w+\s+\d{1,2},\s+\d{4})(?:.|\s)*?(\w+) ending in (\d+)(?:.|\s)*(\$\d+\.\d{2})/;

async function fetchTxnDetails(orderId) {
    const url = `https://www.amazon.com/gp/your-account/order-details?orderID=${orderId}`;
    const response = await fetch(url, { credentials: 'include' });

    if (!response.ok) return;

    return new DOMParser().parseFromString(await response.text(), 'text/html')
        .querySelectorAll('[data-component="paymentDetails"] .a-last .a-expander-container .a-row');
}

async function addTxnDetails() {
    document.querySelectorAll(ORDER_ID_SEL).forEach(async order => {
        const orderNumberMatch = order.innerText.match(/#\s+(\d+(?:-\d+)*)/);

        if (order.querySelector('.txn-info') || !orderNumberMatch) return;
        (await fetchTxnDetails(orderNumberMatch[1])).forEach(txn => {
            const txnDiv = document.createElement('div');

            order.appendChild(txnDiv);
            txnDiv.className = 'txn-info';
            if (txn.matches('.a-color-success')) {
                const m = txn.innerText.match(REFUND_REGEX);

                txnDiv.classList.add('a-color-success');
                txnDiv.textContent = `${m[2]} refund on ${m[1]}`
            } else {
                const m = txn.innerText.match(PAYMENT_REGEX);

                txnDiv.textContent = `${m[4]} on ${m[1]} (${m[2]} *${m[3]})`
            }
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
