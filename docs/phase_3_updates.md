
## Upload Image/pdf/text files to session
On update session pop-up ( when user taps on the dashboard, only mark as completed option is seen), there should be an option to upload image/pdf/text files.
User can select multiple files and upload them.
Next time user opens the pop-up or goes to session details page, the files should be visible in a grid view. We shoud be able to open them full screen and scroll down as well.

[NOTE]: Same is applicable to protocol page as well.


## Changes

## Changes in Nurturing Session page

### 1. Create Nurturing Session page
1. **Date & time ranges**
   - Replace single start/end fields with a slot builder where each slot captures `{fromDate, toDate, fromTime, toTime}` to model ranges such as “21–23 Mar, 5–7 PM”.
   - Support multiple slots per session; validate overlaps and ensure the UI clearly shows each slot before submission.
2. **Attachment support**
   - Embed the same multi-file uploader used on the update modal (drag-and-drop + picker, progress bars, client-side validation for size/type).
   - Persist uploads through the session create API and surface any failures inline so the user can retry before saving.

### 2. Update Nurturing Session page
1. **Attachment gallery**
   - Show existing files in a responsive grid with thumbnail previews (images) or document icons (PDF/text) and filename metadata.
   - Tapping a tile opens a full-screen viewer with next/previous navigation plus download/open-in-new-tab controls. PDFs should render inline; text files can open in a scrollable modal.
2. **Editing experience**
   - Allow additional uploads via the same component, with the list refreshing after each successful upload.
   - Provide delete capability per attachment (with confirmation) and ensure updates sync across clients.

### 3. Rename Session to Healing Session
1. Audit navigation menus, headers, breadcrumbs, and button labels to replace generic “Session” copy with “Healing Session”.
2. Update translation keys/enum values if applicable and confirm analytics/events continue to track under the new label.

### 4. Healing Session creation flow tweaks
1. **Create new client inline**
   - Add a “Create New Client” action that opens a modal or inline form collecting the minimal client profile. On submit, refresh the client dropdown and auto-select the new entry.
2. **Remove “Nurturing Self” option**
   - Update form schema and validations to exclude this option, and run a migration/cleanup so existing records handle the deprecated value gracefully.

### 5. Search & detail access
1. Add `From Date` / `To Date` filters to every session listing (Healing, Nurturing, Protocols) and send the filter values to the backend queries.
2. Ensure each row/card is clickable, taking the user directly into the edit view for that session.

### 6. Dashboard behaviour
1. Provide quick filters/tabs for All, Healing Session, Nurturing Session, and Protocols so users can scope the data set.
2. Keep the default dataset limited to the latest 15 days but add “Previous”/“Next” controls to page through earlier/later windows.
3. Update the global search to query all historical data (not just the 15-day window) while respecting the active filter tab and any date range supplied via the new controls.




Changes in Nurturing Session page
New Nurturing Session creation should have date option plus time option i.e start date and end date and timing from to time. there will be multiple dates and time slots for each date. It should have provision for uploading image/pdf/text files.
Next time user opens the pop-up or goes to session details page, the files should be visible in a grid view. We shoud be able to open them full screen and scroll down as well 
change in name for session in Menu to Healing Session
in Healing Session create new page should have option for create new client. In Healing session the option for nurturing self should be removed.
In all pages session details should have search option with from date and to date
It should on click open the session for edit.
    Dashboard will have options for All/HealingSession/NurturingSession/protocols and search would be for all sessions stored in Database and not for last fifteen days.
