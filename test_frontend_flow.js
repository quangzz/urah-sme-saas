const API_URL = 'http://127.0.0.1:8000';
(async () => {
    try {
        console.log('1. Calling Brandkit');
        const res = await fetch(API_URL + '/api/generate-brandkit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({businessName:'TestCorp', industry:'Technology', colorStyle:'Modern', slogan:''})
        });
        if(!res.ok) { console.error('Brandkit fail', res.status); return; }
        const data = await res.json();
        const cleanedStr = data.data.replace(/```json/g, '').replace(/```/g, '').trim();
        const brandkitObj = JSON.parse(cleanedStr);
        console.log('Brandkit Data:', brandkitObj);
        
        console.log('2. Calling Logo');
        const logoRes = await fetch(API_URL + '/api/generate-logo', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                businessName: 'TestCorp',
                primaryColor: brandkitObj.primaryColor,
                secondaryColor: brandkitObj.secondaryColor,
                shape: brandkitObj.logoConceptShape
            })
        });
        const logoData = await logoRes.json();
        console.log('Logo Success:', logoData.success);
        console.log('Base64 sample:', logoData.logo_base64 ? logoData.logo_base64.substring(0, 30) : 'none');
    } catch(e) { console.error(e) }
})()
