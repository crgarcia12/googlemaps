# Azure Storage Deployment Setup

This GitHub Action automatically deploys your Google Maps application files to Azure Storage.

## Required GitHub Secrets

To use this workflow, you need to configure the following secrets in your GitHub repository:

### 1. AZURE_CREDENTIALS
Create a service principal and get the credentials in JSON format:

```bash
# Create a service principal
az ad sp create-for-rbac --name "github-actions-sp" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} --sdk-auth

# The output will be a JSON like this:
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "...",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### 2. AZURE_STORAGE_ACCOUNT
Your Azure Storage Account name (e.g., `mystorageaccount`)

### 3. AZURE_STORAGE_CONTAINER
Your container name (e.g., `$web` for static websites or `files`)

### Optional Secrets for CDN (if using Azure CDN):
- `AZURE_CDN_PROFILE`: Your CDN profile name
- `AZURE_CDN_ENDPOINT`: Your CDN endpoint name  
- `AZURE_RESOURCE_GROUP`: Your resource group name

## Azure Storage Setup

### 1. Create Storage Account
```bash
# Create a storage account
az storage account create \
  --name mystorageaccount \
  --resource-group myresourcegroup \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Enable static website hosting (optional)
az storage blob service-properties update \
  --account-name mystorageaccount \
  --static-website \
  --404-document error.html \
  --index-document index.html
```

### 2. Create Container
```bash
# Create a container for your files
az storage container create \
  --name mycontainer \
  --account-name mystorageaccount \
  --public-access blob
```

### 3. Configure CORS (if needed for your application)
```bash
az storage cors add \
  --account-name mystorageaccount \
  --services b \
  --methods GET POST PUT \
  --origins "*" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 200
```

## How to Set GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with its corresponding value

## Workflow Triggers

The workflow runs on:
- **Push to main branch**: Automatically deploys when you push changes
- **Pull Request to main**: Tests the deployment without actually uploading
- **Manual trigger**: You can run it manually from the Actions tab

## Files Deployed

The workflow uploads these files:
- `index.html` - Main HTML file
- `styles.css` - CSS styles
- `script.js` - JavaScript logic
- `airports-data2.js` - Airport data

## Cache Settings

The workflow sets appropriate cache headers:
- **HTML files**: 1 hour cache
- **CSS/JS files**: 24 hours cache  
- **Data files**: 7 days cache

## Accessing Your Files

After deployment, your files will be available at:
```
https://{storage-account}.blob.core.windows.net/{container}/index.html
https://{storage-account}.blob.core.windows.net/{container}/styles.css
https://{storage-account}.blob.core.windows.net/{container}/script.js
https://{storage-account}.blob.core.windows.net/{container}/airports-data2.js
```

## Troubleshooting

### Common Issues:
1. **403 Forbidden**: Check if your service principal has the right permissions
2. **Container not found**: Make sure the container exists and the name is correct
3. **File upload fails**: Verify the file paths in the repository

### Debug Steps:
1. Check the Actions tab for detailed logs
2. Verify all secrets are set correctly
3. Test Azure CLI commands locally with your credentials

## Security Notes

- Never commit Azure credentials to your repository
- Use the principle of least privilege for service principals
- Regularly rotate your service principal credentials
- Consider using managed identities if running on Azure infrastructure