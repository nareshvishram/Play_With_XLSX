public with sharing class AccountController {
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountList() {
        return [
            SELECT Id, Name,Phone,NumberOfEmployees
            FROM Account
            LIMIT 10
        ];
    }
}