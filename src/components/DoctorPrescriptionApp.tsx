import { useState, useEffect, useCallback } from 'react' // Import useEffect, useCallback
// Add the corrected imports using the alias:
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// Keep the lucide-react import as it was:
import { Plus, Trash, Edit, ArrowLeft, Check, Loader2 } from "lucide-react";

// Types remain the same, but 'id' might become number if your DB uses INT PK
type Medicine = {
    id?: number | string // Optional ID from DB
    name: string
    dosage: string
    duration: string
    timing: string
    frequency: string
    quantity: string
}

type Prescription = {
    id: number | string // ID from DB
    documentNumber: string
    patientName: string
    patientAge: string
    diagnosis: string
    medicines: Medicine[]
    advice: string
    date: string
}

// Define the base URL for your backend API
// Make sure this line reads:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://doctor-prescription-backend.onrender.com';

// Initial state for a blank prescription form
const initialPrescriptionState: Omit<Prescription, 'id'> & { medicines: Medicine[] } = {
    documentNumber: '',
    patientName: '',
    patientAge: '',
    diagnosis: '',
    medicines: [{
        name: '',
        dosage: '',
        duration: '',
        timing: '',
        frequency: '',
        quantity: ''
    }],
    advice: '',
    date: new Date().toISOString().split('T')[0]
};


export default function DoctorPrescriptionApp() {
    const [view, setView] = useState<'main' | 'create' | 'view'>('main');
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]); // Still useful for displaying the list
    const [currentPrescription, setCurrentPrescription] = useState<Omit<Prescription, 'id'> & { id?: number | string, medicines: Medicine[] }>(initialPrescriptionState);
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [isLoading, setIsLoading] = useState(false); // For loading indicators
    const [error, setError] = useState<string | null>(null); // For displaying errors

    // --- Fetch Prescriptions ---
    const fetchPrescriptions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/prescriptions`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: Prescription[] = await response.json();
            // Ensure medicines is always an array
             const formattedData = data.map(p => ({
                ...p,
                medicines: Array.isArray(p.medicines) ? p.medicines : []
            }));
            setPrescriptions(formattedData);
        } catch (e) {
            console.error("Failed to fetch prescriptions:", e);
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array means this function doesn't change

    // Fetch data when the component mounts or view changes to 'view'
    useEffect(() => {
        if (view === 'view') {
            fetchPrescriptions();
        }
    }, [view, fetchPrescriptions]); // Re-run if view changes or fetchPrescriptions changes (it won't due to useCallback)

    // --- Input Handlers (mostly unchanged) ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentPrescription(prev => ({ ...prev, [name]: value }));
    };

    const handleMedicineChange = (index: number, field: keyof Medicine, value: string) => {
        const newMedicines = [...currentPrescription.medicines];
        // Ensure the medicine object exists (should always in this logic, but safe practice)
        if (newMedicines[index]) {
           newMedicines[index] = { ...newMedicines[index], [field]: value };
            setCurrentPrescription(prev => ({ ...prev, medicines: newMedicines }));
        }
    };

    const addMedicine = () => {
        setCurrentPrescription(prev => ({
            ...prev,
            medicines: [...prev.medicines, { name: '', dosage: '', duration: '', timing: '', frequency: '', quantity: '' }]
        }));
    };

    const removeMedicine = (index: number) => {
        // Prevent removing the last medicine row if desired, or handle empty array later
        // if (currentPrescription.medicines.length <= 1) return;
        const newMedicines = currentPrescription.medicines.filter((_, i) => i !== index);
        setCurrentPrescription(prev => ({ ...prev, medicines: newMedicines }));
    };

    const resetForm = () => {
        setCurrentPrescription(initialPrescriptionState);
        setEditingId(null);
        setError(null); // Clear errors on reset
    };

    // --- CRUD Operations ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const url = editingId
            ? `${API_BASE_URL}/prescriptions/${editingId}`
            : `${API_BASE_URL}/prescriptions`;

        const method = editingId ? 'PUT' : 'POST';

        // Ensure medicines array isn't holding onto deleted IDs if editing
        const payload = {
            ...currentPrescription,
            medicines: currentPrescription.medicines.map(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ({ id: _id, ...med }) => med // Keep the change here
            )
        };
        // Remove top-level ID if creating
        if (!editingId) {
           delete payload.id;
        }


        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

           // No need to manually update state here if fetchPrescriptions runs on view change
            resetForm();
            setView('view'); // Navigate to view, which will trigger fetchPrescriptions
             // Optionally, you could update the local state immediately based on response
             // const savedPrescription = await response.json();
             // if (editingId) {
             //     setPrescriptions(prev => prev.map(p => p.id === editingId ? savedPrescription : p));
             // } else {
             //     setPrescriptions(prev => [savedPrescription, ...prev]);
             // }


        } catch (e) {
            console.error("Failed to save prescription:", e);
             setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (id: number | string) => {
        const prescriptionToEdit = prescriptions.find(p => p.id === id);
        if (prescriptionToEdit) {
            // Ensure medicines array is populated correctly
             const populatedPrescription = {
                ...prescriptionToEdit,
                medicines: Array.isArray(prescriptionToEdit.medicines) ? prescriptionToEdit.medicines : []
             };
            setCurrentPrescription(populatedPrescription);
            setEditingId(id);
            setView('create');
            setError(null);
        } else {
            setError("Could not find prescription to edit."); // Handle case where prescription might be gone
        }
    };

    const handleDelete = async (id: number | string) => {
        // Optional: Add a confirmation dialog
        if (!window.confirm("Are you sure you want to delete this prescription?")) {
            return;
        }

        setIsLoading(true); // Indicate loading during delete
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // Remove from local state immediately for better UX
            setPrescriptions(prev => prev.filter(p => p.id !== id));
            // Or call fetchPrescriptions() again if you prefer consistency
            // fetchPrescriptions();

        } catch (e) {
             console.error("Failed to delete prescription:", e);
             setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Logic ---
    return (
        <div className="container mx-auto p-4">
            {/* Optional: Display Global Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {view === 'main' && (
                 <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold">Doctor Prescription App</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-4 items-center p-6">
                         <p className="text-muted-foreground">Select an Option</p>
                        <Button
                            className="w-full"
                            onClick={() => {
                                resetForm();
                                setView('create');
                            }}
                            disabled={isLoading} // Disable buttons when loading
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                             Enter New Prescription
                        </Button>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setView('view')}
                             disabled={isLoading}
                        >
                             View Previous Prescriptions
                         </Button>
                    </CardContent>
                 </Card>
            )}

            {view === 'create' && (
                <div className="max-w-4xl mx-auto">
                    <Button
                        variant="outline"
                        className="mb-4"
                        onClick={() => {
                            resetForm(); // Reset form data
                            setView('main'); // Go back to main menu
                        }}
                        disabled={isLoading}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {editingId ? 'Edit Prescription' : 'Create New Prescription'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             {/* Form fields remain largely the same, ensure 'value' and 'onChange' point to 'currentPrescription' state */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                               {/* Document Number & Date */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="documentNumber">Document Number</Label>
                                        <Input id="documentNumber" name="documentNumber" value={currentPrescription.documentNumber} onChange={handleInputChange} required disabled={isLoading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input id="date" name="date" type="date" value={currentPrescription.date} onChange={handleInputChange} required disabled={isLoading} />
                                    </div>
                                </div>

                                {/* Patient Name & Age */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="patientName">Patient Name</Label>
                                        <Input id="patientName" name="patientName" value={currentPrescription.patientName} onChange={handleInputChange} required disabled={isLoading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="patientAge">Patient Age</Label>
                                        {/* Consider type="text" for flexibility like "3 months" */}
                                        <Input id="patientAge" name="patientAge" type="text" value={currentPrescription.patientAge} onChange={handleInputChange} required disabled={isLoading} />
                                    </div>
                                </div>

                                {/* Diagnosis */}
                                <div className="space-y-2">
                                    <Label htmlFor="diagnosis">Diagnosis</Label>
                                    <Input id="diagnosis" name="diagnosis" value={currentPrescription.diagnosis} onChange={handleInputChange} required disabled={isLoading} />
                                </div>

                                {/* Medicines Section */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-lg font-semibold">Medicines</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addMedicine} disabled={isLoading}>
                                            <Plus className="mr-2 h-4 w-4" /> Add Medicine
                                        </Button>
                                    </div>
                                    {currentPrescription.medicines.map((medicine, index) => (
                                        <div key={index} className="space-y-4 border rounded-lg p-4 relative">
                                            {/* Medicine Fields: Name, Dosage etc. */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                     <Label htmlFor={`med_name_${index}`}>Name</Label>
                                                     <Input id={`med_name_${index}`} value={medicine.name} onChange={(e) => handleMedicineChange(index, 'name', e.target.value)} required disabled={isLoading} />
                                                 </div>
                                                <div className="space-y-2">
                                                     <Label htmlFor={`med_dosage_${index}`}>Dosage</Label>
                                                     <Input id={`med_dosage_${index}`} value={medicine.dosage} onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)} required disabled={isLoading} />
                                                 </div>
                                            </div>
                                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                 <div className="space-y-2">
                                                     <Label htmlFor={`med_duration_${index}`}>Duration (days)</Label>
                                                     <Input id={`med_duration_${index}`} value={medicine.duration} onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)} required disabled={isLoading}/>
                                                 </div>
                                                 <div className="space-y-2">
                                                     <Label htmlFor={`med_timing_${index}`}>Timing (e.g. Morning, Night)</Label>
                                                     <Input id={`med_timing_${index}`} value={medicine.timing} onChange={(e) => handleMedicineChange(index, 'timing', e.target.value)} required disabled={isLoading}/>
                                                 </div>
                                                 <div className="space-y-2">
                                                     <Label htmlFor={`med_frequency_${index}`}>Frequency (e.g. 1-1-1)</Label>
                                                     <Input id={`med_frequency_${index}`} value={medicine.frequency} onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)} required disabled={isLoading}/>
                                                 </div>
                                             </div>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                 <div className="space-y-2">
                                                     <Label htmlFor={`med_quantity_${index}`}>Quantity</Label>
                                                     <Input id={`med_quantity_${index}`} value={medicine.quantity} onChange={(e) => handleMedicineChange(index, 'quantity', e.target.value)} required disabled={isLoading}/>
                                                 </div>
                                                <div className="flex items-end justify-end">
                                                    {/* Only show remove if more than one medicine */}
                                                    {currentPrescription.medicines.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            onClick={() => removeMedicine(index)}
                                                            className="w-full md:w-auto"
                                                            disabled={isLoading}
                                                            size="sm" // Smaller button
                                                        >
                                                            <Trash className="mr-2 h-4 w-4" /> Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Advice */}
                                <div className="space-y-2">
                                    <Label htmlFor="advice">Advice</Label>
                                    <Textarea id="advice" name="advice" value={currentPrescription.advice} onChange={handleInputChange} rows={3} disabled={isLoading} />
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        {editingId ? 'Update' : 'Save'} Prescription
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {view === 'view' && (
                <div className="max-w-6xl mx-auto">
                    <Button
                        variant="outline"
                        className="mb-4"
                        onClick={() => setView('main')}
                        disabled={isLoading}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                             <CardTitle>Previous Prescriptions</CardTitle>
                             <Button variant="outline" size="sm" onClick={fetchPrescriptions} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null }
                                Refresh List
                             </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoading && prescriptions.length === 0 ? ( // Show loader only on initial load
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : !isLoading && prescriptions.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">
                                    No prescriptions found. Create your first prescription.
                                </p>
                            ) : (
                                <div className="space-y-6">
                                    {prescriptions.map(prescription => (
                                        <Card key={prescription.id} className="relative group"> {/* Add group for hover effects if needed */}
                                            <div className="absolute top-4 right-4 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"> {/* Show buttons on hover */}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleEdit(prescription.id)}
                                                    disabled={isLoading} // Disable actions during general loading
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleDelete(prescription.id)}
                                                    disabled={isLoading}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <CardHeader>
                                                 <div className="flex justify-between items-start">
                                                      <div>
                                                            <h3 className="font-semibold text-lg">{prescription.patientName}</h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                Age: {prescription.patientAge} • Date: {new Date(prescription.date).toLocaleDateString()} {/* Format date */}
                                                            </p>
                                                      </div>
                                                        <p className="text-sm text-muted-foreground pr-20">Doc #: {prescription.documentNumber}</p> {/* Add padding-right */}
                                                 </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <h4 className="font-medium">Diagnosis:</h4>
                                                    <p>{prescription.diagnosis}</p>
                                                </div>
                                                {Array.isArray(prescription.medicines) && prescription.medicines.length > 0 && (
                                                     <div>
                                                          <h4 className="font-medium">Medicines:</h4>
                                                          <ul className="list-disc pl-5 space-y-3 mt-1">
                                                               {prescription.medicines.map((med, idx) => (
                                                                    <li key={med.id || idx} className="space-y-1"> {/* Use med.id if available */}
                                                                         <div className="font-medium">{med.name}</div>
                                                                         <div className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1"> {/* Use grid for alignment */}
                                                                            <span>Dosage: {med.dosage}</span>
                                                                            <span>Duration: {med.duration} days</span>
                                                                            <span>Timing: {med.timing}</span>
                                                                            <span>Frequency: {med.frequency}</span>
                                                                            <span>Quantity: {med.quantity}</span>
                                                                         </div>
                                                                    </li>
                                                               ))}
                                                          </ul>
                                                     </div>
                                                )}

                                                {prescription.advice && (
                                                     <div>
                                                          <h4 className="font-medium">Advice:</h4>
                                                          <p className="whitespace-pre-wrap">{prescription.advice}</p> {/* Preserve line breaks */}
                                                     </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}