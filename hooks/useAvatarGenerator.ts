
import { useState, useEffect, useCallback } from 'react';
import { DigitalTwinPersona } from '../types';
import { generateAvatarFromPersona } from '../services/geminiService';

export const useAvatarGenerator = (
  persona: DigitalTwinPersona | null, 
  setPersona: (p: DigitalTwinPersona | null) => void
) => {
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const generateAvatar = useCallback(async () => {
    // Prevent run if no persona, already has avatar, or currently loading
    if (!persona || persona.avatar_url || isAvatarLoading) return;
    
    setIsAvatarLoading(true); 
    setAvatarError(null);
    
    try {
      const url = await generateAvatarFromPersona(persona);
      if (url) {
        // Only update if URL is valid to prevent loop if generation fails repeatedly returning null
        setPersona({ ...persona, avatar_url: url });
      } else {
        setAvatarError('無法生成預覽');
      }
    } catch (error) {
      console.error("Failed to generate avatar:", error);
      setAvatarError('生成服務忙線中');
    } finally { 
      setIsAvatarLoading(false); 
    }
  }, [persona, isAvatarLoading, setPersona]);

  useEffect(() => { 
    generateAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona?.twin_id]); // Only re-run if persona ID changes, not on every render

  return { isAvatarLoading, avatarError };
};
