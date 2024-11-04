window.onscroll = function() {
    var aboutUsSection = document.querySelector('.about');
    var searchContainer = document.querySelector('.search');
    var aboutUsPosition = aboutUsSection.getBoundingClientRect().top;
    var windowHeight = window.innerHeight;

    if (aboutUsPosition < windowHeight) {
        searchContainer.style.position = 'absolute';
        searchContainer.style.bottom = 40 +'px';

    } else {
        searchContainer.style.position = 'fixed';
        searchContainer.style.bottom = 40 + 'px';
    }

    var size = messages.getBoundingClientRect();
    upperDiv.style.height = size.height + 50 + "px";
};
document.querySelector(".upload-button").addEventListener("click", function() {
    document.querySelector("#fileInput").click();
    fileInput.addEventListener("change", function(){
        if(fileInput.files.length > 0){
            document.querySelector(".upload-button").classList.add("active");
            document.querySelector("#upload-button").classList.add("active");
        }else{
            document.querySelector(".upload-button").classList.remove("active");
            document.querySelector("#upload-button").classList.remove("active");
        }
        
    })
});



var body = document.querySelector('body');
var upperDiv = document.querySelector('.upper-div');
var about = document.querySelector(".about");
var search = document.querySelector(".search");

var searchInput = document.querySelector('#search-input');
var fileInput = document.querySelector("#fileInput");

var messages = document.querySelector('.messages');


//Form a submit işlemi uygulandığında inputları formData birleştiriyor ve alınan inputları ekranda mesaj olarak görünür hale getiriyor
document.querySelector("#mixedInputForm").addEventListener("submit", function(event) {
    event.preventDefault();

    var messageUser = document.createElement('div');
    messageUser.className = "user";

    const formData = new FormData();
    const textData = searchInput.value;
    const fileData = fileInput.files[0];

    if (textData){
        var messageText = document.createElement('p');
        messageText.innerText = textData;
        
        formData.append("textInput", textData);

        console.log("İnput var");
    


    if (fileData) {
        console.log("if(fileData) çalıştı");
        const reader = new FileReader();
        reader.onload = function(e) {
            var imgPreview = document.createElement('img');
            imgPreview.src = e.target.result;
            imgPreview.alt = "Image Preview";
            imgPreview.style.maxWidth = "240px";
            imgPreview.style.borderRadius = "5px";
            messageUser.appendChild(imgPreview);
            messageUser.appendChild(messageText);
        };
        reader.readAsDataURL(fileData);
        formData.append("fileInput", fileData);
    }else{
        messageUser.appendChild(messageText);
    }
    
    document.querySelector('.messages').appendChild(messageUser);
    
    document.querySelector(".upload-button").classList.remove("active");
    document.querySelector("#upload-button").classList.remove("active");

    var size = messages.getBoundingClientRect();
    upperDiv.style.height = size.height + 50 + "px";

    var aboutUsSection = document.querySelector(".about");
    var windowHeight = window.innerHeight;
    var position = aboutUsSection.getBoundingClientRect().top;

    if(position > windowHeight){
        search.style.position = 'fixed';
        search.style.bottom = 40 + 'px';
    }
    document.querySelector(".search-button").classList.add("stop");
    document.querySelector(".upload-button").classList.add("stop");
    searchInput.placeholder = "Oluşturuluyor...";
    searchInput.value = "";
    fileInput.value = "";
    searchInput.setAttribute("readonly", true);
    sendInput(formData);

    
    }else if(fileData){
        alert("Sadece görsel ile soru oluşturamazsınız. Bir text de girmelisiniz!");
    }
});


//Alınan inputları yapay zekaya göndermek için python koduna gönderiyor
function sendInput(formData) {

    fetch('/process', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        console.log('Başarıyla gönderildi:', data);
        getAnswer();
    })
    .catch((error) => {
        console.error('Hata:', error);
    });
}

//Yapay zekanın oluşturduğu pdf i alıp wab sayfasında mesaj olarak görünür hale getiriyor
function getAnswer(){
    var messageAi = document.createElement('div');
    messageAi.className = "ai";
    var messageText = document.createElement('p');
    fetch('/get_metin')
        .then(response => response.json())
        .then(data => {
            var metin = data.message;
            messageText.innerHTML = metin;
        })
        .catch(error => console.error('Hata:', error));

        var pdfFrame = document.createElement('iframe');
        pdfFrame.src = "/static/output.pdf";
        pdfFrame.width = "224px";
        pdfFrame.height = "300px";
        pdfFrame.style.border = "none";
        pdfFrame.style.borderRadius = "5px";
    
        messageAi.appendChild(pdfFrame);
    
    var buttons = document.createElement('div');
    buttons.style.display = "block";
    buttons.style.marginTop = "10px";
    buttons.style.position = "relative";
    buttons.style.width = "100%";
    buttons.style.height = "30px";
    var downloadLink = document.createElement('a');
    var downloadİcon = document.createElement('i');
    downloadİcon.className = "fa-solid fa-file-arrow-down";
    downloadİcon.style.color = "white";
    downloadİcon.style.fontSize = "20px";
    downloadLink.href = "/static/output.pdf";
    downloadLink.download = "yapisal.pdf";
    downloadLink.style.display = "inline-block";
    downloadLink.style.position = "absolute";
    downloadLink.style.left = "0px";

    var revise = document.createElement('a');
    revise.className = "revise-button";
    var reviseIcon = document.createElement('i');
    reviseIcon.className = "fa-solid fa-arrow-turn-up";
    reviseIcon.style.color = "white";
    reviseIcon.style.fontSize = "20px";
    revise.style.display = "inline-block";
    revise.style.position = "absolute";
    revise.style.right = "0px";
    revise.style.cursor = "pointer";
    

    downloadLink.appendChild(downloadİcon);
    revise.appendChild(reviseIcon);

    buttons.appendChild(downloadLink);
    buttons.appendChild(revise);

    messageAi.appendChild(buttons);
    messageAi.appendChild(messageText);
    messages.appendChild(messageAi);

    document.querySelector(".revise-button").addEventListener("click", function(){
        console.log("revise butonuna tıklandı");
        fetch('/run_function', {
            method: 'POST',
        })
        .then(response => {
            return response.json();
        })
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error('Hata:', error);
        });
    });

    var size = messages.getBoundingClientRect();
    upperDiv.style.height = size.height + 50 + "px";

    var aboutUsSection = document.querySelector(".about");
    var windowHeight = window.innerHeight;
    var position = aboutUsSection.getBoundingClientRect().top;
    if(position > windowHeight){
        search.style.position = 'fixed';
        search.style.bottom = 40 + 'px';
    }
    var size = messages.getBoundingClientRect();
    upperDiv.style.height = size.height + 50 + "px";
    console.log("Upperdiv : " + upperDiv.style.height);
    console.log("Size : " + size.height);
    var aboutUsSection = document.querySelector(".about");
    var windowHeight = window.innerHeight;
    var position = aboutUsSection.getBoundingClientRect().top;

    if(position > windowHeight){
        search.style.position = 'fixed';
        search.style.bottom = 40 + 'px';
    }

    document.querySelector(".search-button").classList.remove("stop");
    document.querySelector(".upload-button").classList.remove("stop");
    searchInput.placeholder = "Buraya yaz";
    searchInput.removeAttribute("readonly")
}


//Sayfanın altındaki about kısmının en aşağıda kalmasını sağlıyor
window.addEventListener("resize", function(){
    console.log("kontrol-resize");
    var size = messages.getBoundingClientRect();
    upperDiv.style.height = size.height + 50 + "px";
})


