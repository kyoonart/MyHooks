import { useState, useCallback, useRef } from 'react';
import { useMountedState } from 'react-use';

function useDataURL(): [string, (file: File) => void] {
  const [dataURL, setDataURL] = useState('');
  const fileRef = useRef<File | null>(null);
  const isMounted = useMountedState();
  const toDataURL = useCallback(
    (file: File) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);
      fileRef.current = file;

      reader.onload = function() {
        if (isMounted() && fileRef.current === file) {
          setDataURL(reader.result as string);
        }
      };

      return () => {
        if (reader.readyState === reader.LOADING) {
          reader.abort();
        }
      };
    },
    [isMounted]
  );
  return [dataURL, toDataURL];
}

export default useDataURL;
