namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patient;  // Make sure the Patient model exists and is used here

class PatientController extends Controller
{
    // Method to get patient details by ID
    public function show($id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['error' => 'Patient not found'], 404);
        }

        return response()->json($patient);
    }

    // Method to fetch all patients
    public function index()
    {
        $patients = Patient::all();  // Retrieve all patients from the database

        return response()->json($patients);
    }

    // Method to update patient data
    public function update(Request $request, $id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['error' => 'Patient not found'], 404);
        }

        $patient->update($request->all());  // Update patient with the request data

        return response()->json($patient);
    }

    // Method to store a new patient
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'age' => 'required|numeric',
            'gender' => 'required|string',
            // Add other necessary fields
        ]);

        $patient = Patient::create($validated);

        return response()->json($patient, 201);
    }

    // Method to delete patient data
    public function destroy($id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['error' => 'Patient not found'], 404);
        }

        $patient->delete();

        return response()->json(['message' => 'Patient deleted successfully']);
    }
}