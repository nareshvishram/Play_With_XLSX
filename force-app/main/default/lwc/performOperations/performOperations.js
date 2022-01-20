import { LightningElement, track } from 'lwc';

import sheetJS from '@salesforce/resourceUrl/xlsx_new';

import {loadScript } from 'lightning/platformResourceLoader';

export default class PerformOperations extends LightningElement {
    
    @track disableButton = true;
    connectedCallback() {
        console.log("renderedCallback xlsx");
        if (this.librariesLoaded) return;
        this.librariesLoaded = true;
        Promise.all([loadScript(this, sheetJS + "/xlsx_new/xlsx.full.min.js")])
        .then(() => {
            console.log("success");
            console.log(' load  sheet JS complete ');
            this.disableButton=false;
        })
        .catch(error => {
            console.log("failure");
        });
  }
    operations(event) {
        //getting files list from the front-end
        var f = event.target.files[0];
        var reader = new FileReader();
        var range='D2:D11';
        let ws='Samples'
        reader.onload = function(e) {
            var data = new Uint8Array(e.target.result);
            var wb = XLSX.read(data, {type: "array", template: true, skipParse: true, bookVBA:true});
            /* Modify data */
             if(typeof range == "string") range = XLSX.utils.decode_range(range);
             
            var aoa=Array(10).fill().map(entry => Array(2))
            let size=range.e.r - range.s.r + 1;
            for(let i=0;i<size;i++){
                aoa[i][0]='Sample'+(i+1);
                if((i+1)%2==0){
                    aoa[i][1]='Tested';
                }else{
                    aoa[i][1]='';
                }
            }
            console.log('aoa',aoa);
            XLSX.utils.template_set_aoa(wb, ws, range,aoa);
            console.timeEnd("edit");
            /* Write new file */
            var ext = f && f.name && f.name.slice(-5) == ".xlsm" ? "xlsm" : "xlsx";
            console.time("write");
            XLSX.writeFile(wb, "ExcelFile_AMSM-NA001_AMSR-1."+ ext, {template: true});
            console.timeEnd("write");
        };
        reader.readAsArrayBuffer(f);
    };
}