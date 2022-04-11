const API_ENDPOINT = 'https://api.unidrop.me/';
let isShareExist = false;
let isShareAFile = false;
let fileUrl = '';
let shareContent = '';

// get share code from url after the /, if there is return the code otherwise return null
function getShareCode() {
    const url = window.location.href;
    const urlArr = url.split('/');
    if (urlArr.length > 2) {
        if(urlArr[3] !== 'index.html' && urlArr[3].length === 5){
            return urlArr[3];
        }
        return null;
    }
    return null;
}


// get share by current ip from server /share/ip
async function getShareByIp() {
    try{
        const response = await fetch(API_ENDPOINT + 'share/ip', {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return [data.success, data.response.contentType, data.response.content, data.response.id];
    }catch(e){
        console.log(e);
        throw e;
    }
}

// get share by code from server /share/code, params: code
async function getShareByCode(code) {
    try{
        const response = await fetch(API_ENDPOINT + 'share/code?code=' + code, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return [data.success, data.response.contentType, data.response.content, data.response.id];
    }catch(e){
        console.log(e);
        throw e;
    }
}

// request a share from server, contentType is TEXT
function requestShareText(content) {
    fetch(API_ENDPOINT + 'share', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: content,
            contentType: 'TEXT',
        })
    })
        .then(response => response.json())
        .then(data => {
            Swal.fire({
                title: 'Share created!',
                confirmButtonColor: '#459aee', // light blue color #3da4ab
                html: `Your secret code is: <b>${data.response.code.toUpperCase()}</b><br/> <br/>Share link: <a href="${window.location.origin}/${data.response.code}">${window.location.origin}/${data.response.code}</a>`,
            })
            .then(result =>{
                if(result.isConfirmed){
                    window.location.reload();
                }
            })
        })
        .catch(error => {
            console.log(error);
        });
}

// request share file from server, take in filename as params
async function requestShareFile(filename, fileObj) {
    fetch(API_ENDPOINT + 'share', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fileName: filename,
            contentType: 'FILE',
        })
    })
        .then(response => response.json())
        .then(data => {
            if(data.success){
                console.log(data);
                fetch(data.response.signedUrl,{
                    method: 'PUT',
                    body: fileObj
                })
                .then(data2 => data2.text())
                .then(data2 => {
                    Swal.fire({
                        title: 'Share created!',
                        confirmButtonColor: '#459aee', // light blue color #3da4ab
                        html: `Your secret code is: <b>${data.response.code.toUpperCase()}</b><br/> <br/>Share link: <a href="${window.location.origin}/${data.response.code}">${window.location.origin}/${data.response.code}</a>`,        
                    })
                        .then(result =>{
                            if(result.isConfirmed){
                                window.location.reload();
                            }
                        })

                }
                )
                .catch(error => {
                    console.log(error);
                });
            }
        })
        .catch(error => {
            console.log(error);
        });
}

// request file download link from server /share/id/:id
async function getDownloadLink(id) {
    try {
        const response = await fetch(API_ENDPOINT + 'share/id/' + id, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.response.url;
    }
    catch (e) {
        console.log(e);
        throw e;
    }
}

// delete all shares from server /share
async function deleteAllShares() {
    try {
        const response = await fetch(API_ENDPOINT + 'share', {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.success;
    }
    catch (e) {
        console.log(e);
        throw e;
    }
}


// listen file-dropbox on change event
document.getElementById('file-dropbox').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const fileSize = file.size;
    const fileName = file.name;
    if (fileSize > 50000000) {
        alert('File size is too large (Must be < 50MB)');
        return;
    }
    requestShareFile(fileName, file);
});

const handleRemoveAll = async ()=>{
    await deleteAllShares();
    Swal.fire({
        title: 'All shares deleted!',
        confirmButtonColor: '#459aee', // light blue color #3da4ab
        html:'You shares have been deleted successfully!',
    })        
        .then(result =>{
            if(result.isConfirmed){
                window.location.reload();
            }
        })
};


window.onload = async ()=>{  
    if(!localStorage.getItem('hasVisited')){
        localStorage.setItem('hasVisited', true);
        Swal.fire({
            title: 'Welcome to UniDrop!',
            confirmButtonColor: '#459aee', // light blue color #3da4ab
            html: 'Unidrop is a simple way to share files and your clipboard with others on the same network as you. <br/> <br/>UniDrop shares files or your clipboard with others by creating shares on this website.<br/> <br/>Once you have created a share, use the reset button to create a new one! <br/><br/><b> File uploads are limited to 50MB.</b>',
        })
    }

    const shareCode = getShareCode();
    let resultTuple = [];
    if (shareCode) {
        resultTuple = await getShareByCode(shareCode);
    } else {
        resultTuple = await getShareByIp();
        //    if resultTuple[0] is false, means there is no share by current ip
        if(resultTuple[0]){
        document.getElementById('reset-button').classList.remove('hidden');
        }
    }
    
    console.log(resultTuple);
    if(resultTuple[0]){
        if(resultTuple[1] === 'FILE'){
            const getUrl = await getDownloadLink(resultTuple[3]);
            console.log(getUrl);
            // hide textclipboard-container and show file-container
            document.getElementById('textclipboard-container').classList.add('hidden');
            document.getElementById('file-container').classList.remove('hidden');
            // set innerHTML for id file-select
            document.getElementById('file-select').innerHTML = `<a href="${getUrl}">Download file</a>`;
            document.getElementById('upload-icon').innerHTML = '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.75 14.75V16.25C4.75 17.9069 6.09315 19.25 7.75 19.25H16.25C17.9069 19.25 19.25 17.9069 19.25 16.25V14.75"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 14.25L12 4.75"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.75 10.75L12 14.25L15.25 10.75"></path>'
            document.getElementById('file-container').removeAttribute('onclick');
            document.getElementById('file-container').addEventListener('click', async () => {
                window.open(getUrl, '_blank');
            });
        }
        else{
            const getText = resultTuple[2];
            // hide file-container and show textclipboard-container
            document.getElementById('file-container').classList.add('hidden');
            document.getElementById('textclipboard-container').classList.remove('hidden');
            // Copy getText to clipboard
            shareContent = getText;
            document.getElementById('copyclipboard').innerHTML = '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.5 15.25V15.25C5.5335 15.25 4.75 14.4665 4.75 13.5V6.75C4.75 5.64543 5.64543 4.75 6.75 4.75H13.5C14.4665 4.75 15.25 5.5335 15.25 6.5V6.5"></path><rect width="10.5" height="10.5" x="8.75" y="8.75" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" rx="2"></rect>'
            document.getElementById('textclipboard-container').removeAttribute('onclick');
            document.getElementById('textclipboard-container').addEventListener('click', async () => {
                await navigator.clipboard.writeText(shareContent);
                Swal.fire(
                    'Share copied!',
                    'The share content has been copied to your clipboard',
                    'success'
                    
                    )
            });
            document.getElementById('textclipboard').innerHTML = `<a href="#" onclick="">Paste to clipboard</a>`;
            // create context menu for file-select to upload a new file on right click
        }
    }
}
