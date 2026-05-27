const sdk = require('node-appwrite');

module.exports = async function(context) {
    const client = new sdk.Client();
    const messaging = new sdk.Messaging(client);
    
    // Taarifa za Appwrite
    const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
    const PROJECT_ID = '6a1428040000b744755b';
    const DATABASE_ID = '6a142da00005f285bb3b';
    const API_KEY = 'standard_a28af98fec3f4d5afba95bc08a0585ecca394576269143389ac9ea6630f2d6bda83f59513bbd7001186e87918fc9b3bdaa93054c3296be27650469ad48ddf1eaa911066c676f5524cd7a28e922e2ea557bb34c4c9e91ca9ea8d9e7ed0b3114fc153ece0dece3d7935271bd31a7d30362e53e7ec895bd1a1bea666c8a7728b09e';
    
    client
        .setEndpoint(ENDPOINT)
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
    
    let eventData = {};
    try {
        eventData = typeof context.req.body === 'string' ? JSON.parse(context.req.body) : context.req.body;
    } catch(e) {}
    
    const event = context.req.headers['x-appwrite-event'] || '';
    context.log('Event:', event);
    
    let email = null, subject = '', htmlBody = '';
    
    try {
        // 1. NEW CUSTOMER
        if (event.includes('customers.documents.create')) {
            email = eventData.email;
            subject = 'Karibu ' + (eventData.fullName || 'Mteja') + '! - SEWAGE COLLECTION SERVICE';
            htmlBody = '<h1 style="color:#00c853">SEWAGE COLLECTION SERVICE</h1><h2>Karibu ' + (eventData.fullName || '') + '! 🎉</h2><p>Umefanikiwa kujisajili kwenye huduma yetu.</p><p><strong>Simu:</strong> ' + (eventData.phone || 'N/A') + '</p><p><strong>Anwani:</strong> ' + (eventData.address || 'N/A') + '</p>';
        }
        
        // 2. NEW REQUEST
        else if (event.includes('service_requests.documents.create')) {
            email = eventData.customerEmail;
            const rid = (eventData.$id || '').substring(0, 8);
            subject = 'Ombi #' + rid + ' Limepokelewa - SEWAGE SERVICE';
            htmlBody = '<h1 style="color:#00c853">OMBI LIMEPOKELEWA</h1><h2>Habari ' + (eventData.customerName || '') + '!</h2><p><strong>Huduma:</strong> ' + (eventData.serviceType || 'N/A') + '</p><p><strong>Tarehe:</strong> ' + (eventData.preferredDate || 'N/A') + '</p><p><strong>Eneo:</strong> ' + (eventData.customerLocation || 'N/A') + '</p>';
        }
        
        // 3. STATUS UPDATE
        else if (event.includes('service_requests.documents.update')) {
            email = eventData.customerEmail;
            const cost = eventData.cost || 0;
            const msgs = {
                'pending': 'Ombi Linasubiri ⏳',
                'onroute': 'Timu Iko Njiani! 🚛',
                'completed': 'Huduma Imekamilika! Gharama: TSh ' + cost.toLocaleString() + ' ✅',
                'cancelled': 'Ombi Limeghairiwa ❌'
            };
            subject = (msgs[eventData.status] || 'Update') + ' - SEWAGE SERVICE';
            htmlBody = '<h1 style="color:#00c853">UPDATE YA OMBI</h1><h2>' + (msgs[eventData.status] || 'Hali Imebadilika') + '</h2>';
        }
        
        if (email) {
            const result = await messaging.createEmail(
                sdk.ID.unique(), subject, htmlBody, [], [], [], [email], []
            );
            context.log('✅ Email sent:', result.$id);
            return context.res.json({ success: true, emailId: result.$id });
        }
        
        return context.res.json({ success: false, reason: 'No event match' });
        
    } catch(e) {
        context.error('Error:', e.message);
        return context.res.json({ success: false, error: e.message });
    }
};
