/*
a little component that confirms with the user 
if they want to go through with an action. 

such as: 
- deleting from the database 
- switching to a different page (form data will be lost)
- etc. 

IN: (Message/warning , Confirm_function())
it'll just be alittle pop up block 
*/ 




export default function ConfirmationBox(
    // confirmThis : boolean, 
    // displaySelf : boolean 
){


  const handleClose = () => {
      //setShowScheduleForm(false)
  }



    return(<>

                      <div className="form-overlay" onClick={handleClose}>
                        <div className="form-modal" onClick={e => e.stopPropagation()}> 
                            
                          
                          
                          {/* THE FORM */}
                          <form
                            className="portal-form"
                            onSubmit={(e) => {
                              e.preventDefault()
                            }}> 
        
        
        
                            <div className="form-actions">
                              <button type="submit" className="btn-primary">
                                Create
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
    </>)
}


