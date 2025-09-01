import { processSequencesAPI } from '@/services/api';
import { PROCESS_SEQUENCES } from '@/data/processSequences';

export const fetchProcessSequence = async (productType: string, setProcessSequence: any, setIsLoadingProcessSequence: any, productId?: string) => {
  if (!productType) return;
  
  setIsLoadingProcessSequence(true);
  try {
    let response;
    if (productId) {
      // Use the new endpoint that filters by saved product selections
      response = await processSequencesAPI.getForProduct(productId);
    } else {
      // Use the original endpoint for general product type sequences
      response = await processSequencesAPI.getByProductType(productType);
    }
    setProcessSequence(response);
  } catch (error) {
    console.error('Error fetching process sequence:', error);
    // Fallback to static data if API fails
    const staticData = PROCESS_SEQUENCES.find(seq => seq.productType === productType);
    if (staticData) {
      setProcessSequence({
        product_type: staticData.productType,
        description: staticData.description,
        steps: staticData.steps.map((step, index) => ({
          id: `static-${index}`,
          name: step.name,
          isCompulsory: step.isCompulsory,
          order: step.order
        }))
      });
    }
  } finally {
    setIsLoadingProcessSequence(false);
  }
};
