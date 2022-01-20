import { api, LightningElement, track, wire } from 'lwc';
import getContentDetails from '@salesforce/apex/ContentManagerService.getContentDetails';
import deleteContentDocument from '@salesforce/apex/ContentManagerService.deleteContentDocument';
import { NavigationMixin } from 'lightning/navigation';
import workbook from '@salesforce/resourceUrl/xlsx';
import {loadScript } from 'lightning/platformResourceLoader';
import mf from '@salesforce/resourceUrl/myFiles';

const columns = [
    { label: 'Title',       fieldName: 'Title', wrapText : true,
        cellAttributes: { 
            iconName: { fieldName: 'icon' }, iconPosition: 'left' 
        }
    },
    { label: 'File Size',   fieldName: 'Size' },
    { label: 'Download', type:  'button', typeAttributes: { 
            label: 'Download', name: 'Download', variant: 'brand', iconName: 'action:download', 
            iconPosition: 'right' 
        } 
    },
    { label: 'Preview', type:  'button', typeAttributes: { 
            label: 'Preview', name: 'Preview', variant: 'brand', iconName: 'action:edit', 
            iconPosition: 'right' 
        } 
    }
];

export default class ContentManager extends NavigationMixin(LightningElement) {

    @api title;
    @api showDetails;
    @api showFileUpload;
    @api showsync;
    @api recordId;
    @api usedInCommunity;
    @api showFilters;
    @api accept = '.xls,.xlsm';

    @track dataList;
    @track columnsList = columns;
    isLoading = false;

    wiredFilesResult;

    renderedCallback() {
       
    }

    connectedCallback() {
        console.log('in connectedCallback');
        console.log("renderedCallback xlsx");
        if (this.librariesLoaded) return;
        this.librariesLoaded = true;
        Promise.all([loadScript(this, workbook + "/xlsx/xlsx.full.min.js")])
        .then(() => {
            console.log("success");
        })
        .catch(error => {
            console.log("failure");
        });
        //console.log('myfile@@',mf);
        this.handleSync();
    }

    getBaseUrl(){
        let baseUrl = 'https://'+location.host+'/';
        console.log('baseURL',baseUrl);
        return baseUrl;
    }

    handleRowAction(event){
        console.log('handleAction');
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if(actionName==='Download'){
             this.downloadFile(row);
        }else if(actionName==='Preview'){
            this.PreviewFile(row);
        }

    }
    downloadFile(file){
        this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: file.downloadUrl
                }
            }, false 
        );
    }

    PreviewFile(file){
        this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: file.previewUrl
                }
            }, false 
        );
    }

    testConsole(file){
        //  console.log("renderedCallback myFile");
        // Promise.all([loadScript(this, mf + "/myFiles/ExcelFile_AMSM-NA001_AMSR-1.xlsm")])
        // .then((res) => {
        //     console.log("success reading file@@",res);
        // })
        // .catch(error => {
        //     console.log("failure in file read"+error);
        // });
        // console.log('myfile@@',mf+'/myFiles/ExcelFile_AMSM-NA001_AMSR-1.xlsm');
        let XLSX = window.XLSX;
        // let url=mf+'/myFiles/ExcelFile_AMSM-NA001_AMSR-1.xlsm';
       // let ws = XLSX.readFile(url);
        console.log('ws@@',XLSX);
        const analysisExcel = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsBinaryString(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
        analysisExcel(file)
        .then((result) => {
            let datas = []; //  Store the acquired data 
            let XLSX = window.XLSX;
            let workbook = XLSX.read(result);
            for (let sheet in workbook.Sheets) {
                if (workbook.Sheets.hasOwnProperty(sheet)) {
                    datas = datas.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
                }
            }
            this.dataList = datas;
            const toastEvent = new ShowToastEvent({
                variant: "success",
                message: ' The file has been uploaded and parsed successfully ',
            });
            this.dispatchEvent(toastEvent);
        });
    }

    handleSync(){

        let imageExtensions = ['png','jpg','gif'];
        let supportedIconExtensions = ['ai','attachment','audio','box_notes','csv','eps','excel','exe',
                        'flash','folder','gdoc','gdocs','gform','gpres','gsheet','html','image','keynote','library_folder',
                        'link','mp4','overlay','pack','pages','pdf','ppt','psd','quip_doc','quip_sheet','quip_slide',
                        'rtf','slide','stypi','txt','unknown','video','visio','webex','word','xml','zip'];

        this.isLoading = true;
        getContentDetails({
            recordId : this.recordId
        })
        .then(result => {
            let parsedData = JSON.parse(result);
            let stringifiedData = JSON.stringify(parsedData);
            let finalData = JSON.parse(stringifiedData);
            let baseUrl = this.getBaseUrl();
            finalData.forEach(file => {
                file.downloadUrl = baseUrl+'sfc/servlet.shepherd/document/download/'+file.ContentDocumentId;
                file.fileUrl     = baseUrl+'sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId='+file.Id;
                file.previewUrl  = baseUrl+'lightning/r/ContentDocument/'+file.ContentDocumentId+'/view';
                file.CREATED_BY  = file.ContentDocument.CreatedBy.Name;
                file.Size        = this.formatBytes(file.ContentDocument.ContentSize, 2);
                let fileType = file.ContentDocument.FileType.toLowerCase();
                console.log('finalData@@',file.VersionData);
                if(imageExtensions.includes(fileType)){
                    file.icon = 'doctype:image';
                }else{
                    if(supportedIconExtensions.includes(fileType)){
                        file.icon = 'doctype:' + fileType;
                    }
                }
                this.testConsole(file);
            });
            this.dataList = finalData;
        })
        .catch(error => {
            console.error('**** error **** \n ',error)
        })
        .finally(()=>{
            this.isLoading = false;
        });
    }

    handleUploadFinished(){
        this.handleSync();
        //eval("$A.get('e.force:refreshView').fire();");
    }
    formatBytes(bytes,decimals) {
        if(bytes == 0) return '0 Bytes';
        var k = 1024,
            dm = decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}