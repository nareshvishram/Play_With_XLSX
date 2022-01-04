public with sharing class AccountController {
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountList() {
        return [
            SELECT Id, Name,Phone,NumberOfEmployees
            FROM Account
            LIMIT 10
        ];
    }
    @AuraEnabled(cacheable=true)
    public static String getData(){
        StaticResource srObject=[select id,body from StaticResource where name='ExcelFile_AMSM-NA001_AMSR-1.xlsm'];
        blob tempBlob = srObject.Body;
        string s = EncodingUtil.base64Encode(tempBlob);   
        return EncodingUtil.base64Decode(s).toString();
    }

}